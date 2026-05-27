import express from 'express';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 3001;
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const app = express();
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Health check — Render uses this for keep-alive ping
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'oem-image-worker',
    uptime_sec: Math.round(process.uptime()),
    node: process.version,
  });
});

// 🎭 Lip-sync clip endpoint — Vercel calls this with job_id
// fal.ai SadTalker/Hallo: mascot face + audio → talking video
app.post('/process-lipsync-clip-job', async (req, res) => {
  const auth = req.headers.authorization || '';
  const expected = process.env.WORKER_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const jobId = Number(req.body?.job_id);
  if (!jobId) return res.status(400).json({ error: 'job_id required' });
  res.json({ ok: true, job_id: jobId, status: 'accepted', worker: 'render-lipsync' });
  processLipsyncJob(jobId).catch((e) => console.error(`[lipsync worker] job ${jobId} crashed:`, e));
});

async function processLipsyncJob(jobId) {
  const { data: job, error: fetchErr } = await supabase
    .from('lipsync_clip_jobs')
    .select('id, image_url, audio_url, model, status')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr || !job) {
    console.error(`[lipsync worker] job ${jobId} not found:`, fetchErr?.message);
    return;
  }
  if (job.status === 'done' || job.status === 'processing') {
    console.log(`[lipsync worker] job ${jobId} already ${job.status} — skip`);
    return;
  }

  await supabase
    .from('lipsync_clip_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  try {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error('FAL_KEY not set');
    const model = job.model || 'fal-ai/sadtalker';
    const t0 = Date.now();

    // 1) Submit to fal.ai queue API → request_id
    // input schema ต่างกันตามโมเดล:
    //  - SadTalker: source_image_url + driven_audio_url
    //  - OmniHuman / VEED Fabric / Infinitalk: image_url + audio_url (+resolution)
    const FAL_INPUT = {
      'fal-ai/sadtalker': () => ({ source_image_url: job.image_url, driven_audio_url: job.audio_url }),
      'fal-ai/bytedance/omnihuman/v1.5': () => ({ image_url: job.image_url, audio_url: job.audio_url, resolution: '720p' }),
      'fal-ai/bytedance/omnihuman': () => ({ image_url: job.image_url, audio_url: job.audio_url, resolution: '720p' }),
      'veed/fabric-1.0': () => ({ image_url: job.image_url, audio_url: job.audio_url, resolution: '720p' }),
      'fal-ai/infinitalk': () => ({ image_url: job.image_url, audio_url: job.audio_url }),
    };
    const buildInput = FAL_INPUT[model] || (() => ({ image_url: job.image_url, audio_url: job.audio_url }));
    const submitResp = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildInput()),
    });
    const submitText = await submitResp.text();
    if (!submitResp.ok) {
      throw new Error(`fal submit ${submitResp.status}: ${submitText.slice(0, 400)}`);
    }
    let submitData;
    try { submitData = JSON.parse(submitText); } catch { throw new Error(`fal submit non-JSON: ${submitText.slice(0, 300)}`); }
    const requestId = submitData.request_id;
    if (!requestId) throw new Error(`no request_id from fal: ${JSON.stringify(submitData).slice(0, 300)}`);
    // fal คืน status_url / response_url มาให้ตอน submit — ต้องใช้ค่านี้ตรง ๆ
    // (สร้าง URL เองพังกับโมเดลที่ path ซ้อนหลายชั้น เช่น fal-ai/bytedance/omnihuman/v1.5
    //  → body ว่าง → "status non-JSON" วนจน timeout)
    const statusUrl = submitData.status_url || `https://queue.fal.run/${model}/requests/${requestId}/status`;
    const resultUrl = submitData.response_url || `https://queue.fal.run/${model}/requests/${requestId}`;
    console.log(`[lipsync worker] job ${jobId} → fal request_id=${requestId} · status_url=${statusUrl}`);

    // 2) Poll status (up to 12 min — OmniHuman/คิว fal อาจนานเกิน 6 นาที)
    const POLL_TIMEOUT_MS = 12 * 60_000;
    let videoUrl = null;
    let pollCount = 0;
    while (Date.now() - t0 < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, 4000));
      pollCount++;
      const statusResp = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      });
      const statusText = await statusResp.text();
      let statusData;
      try { statusData = JSON.parse(statusText); } catch { console.warn(`[lipsync worker] status HTTP ${statusResp.status} non-JSON: ${statusText.slice(0,200)}`); continue; }
      const s = statusData.status;
      // log สถานะทุก ~20s — debug ว่า fal ค้าง IN_QUEUE หรือ IN_PROGRESS
      if (pollCount % 5 === 1) {
        const secs = Math.round((Date.now() - t0) / 1000);
        console.log(`[lipsync worker] job ${jobId} status=${s || JSON.stringify(statusData).slice(0, 150)} queue_pos=${statusData.queue_position ?? '-'} (${secs}s)`);
      }
      if (s === 'COMPLETED') {
        const resp = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${falKey}` },
        });
        const result = await resp.json();
        // fal output shapes vary by model — try common keys
        videoUrl = result?.video?.url
          || result?.output?.video?.url
          || result?.output_video?.url
          || result?.video_url
          || (typeof result?.video === 'string' ? result.video : null);
        if (!videoUrl) throw new Error(`fal COMPLETED but no video URL — keys: ${Object.keys(result || {}).join(',')}, preview: ${JSON.stringify(result).slice(0,300)}`);
        break;
      }
      if (s === 'FAILED' || s === 'CANCELLED') {
        throw new Error(`fal ${s}: ${JSON.stringify(statusData).slice(0,300)}`);
      }
      // IN_QUEUE / IN_PROGRESS → keep polling
    }
    if (!videoUrl) throw new Error('fal timed out after 12 min');

    const took = Date.now() - t0;
    await supabase
      .from('lipsync_clip_jobs')
      .update({
        status: 'done',
        video_url: videoUrl,
        provider: 'fal-ai-render',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    console.log(`[lipsync worker] ✅ job ${jobId} done in ${took}ms → ${videoUrl}`);
  } catch (e) {
    console.error(`[lipsync worker] job ${jobId} failed:`, e.message);
    await supabase
      .from('lipsync_clip_jobs')
      .update({
        status: 'failed',
        error: String(e.message).slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

// Main worker endpoint — Vercel calls this with job_id
app.post('/process-image-job', async (req, res) => {
  const auth = req.headers.authorization || '';
  const expected = process.env.WORKER_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const jobId = Number(req.body?.job_id);
  if (!jobId) return res.status(400).json({ error: 'job_id required' });

  // Acknowledge fast (Vercel can hang up — we'll do the long work in background)
  res.json({ ok: true, job_id: jobId, status: 'accepted', worker: 'render' });

  // Fire-and-forget — Node keeps the process alive until this resolves
  processJob(jobId).catch((e) => console.error(`[worker] job ${jobId} crashed:`, e));
});

async function processJob(jobId) {
  const { data: job, error: fetchErr } = await supabase
    .from('image_jobs')
    .select('id, prompt, model, status')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr || !job) {
    console.error(`[worker] job ${jobId} not found:`, fetchErr?.message);
    return;
  }

  if (job.status === 'done' || job.status === 'processing') {
    console.log(`[worker] job ${jobId} already ${job.status} — skipping`);
    return;
  }

  await supabase
    .from('image_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    const model = job.model || 'openai/gpt-5.4-image-2';
    const fullPrompt = `Create a high-quality image: ${job.prompt}.

Style: warm, professional. Aspect: vertical 4:5. Maximum quality, photorealistic detail.`;

    console.log(`[worker] job ${jobId} → ${model} (prompt ${job.prompt.slice(0, 60)}...)`);
    const t0 = Date.now();

    // ⏱️ Timeout 5 นาที — กัน OpenRouter ค้างไม่จบ (ไม่มี wall-clock kill ของ Render)
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort('openrouter timeout 5min'), 5 * 60_000);

    let r;
    try {
      r = await fetch(OPENROUTER_API, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.PUBLIC_URL || 'https://postpost.adsventure.ltd',
          'X-Title': 'PostPost',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          modalities: ['image', 'text'],
          max_tokens: 16384,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const took = Date.now() - t0;
    console.log(`[worker] job ${jobId} ${model} took=${took}ms status=${r.status}`);

    // อ่าน response เป็น text ก่อน — กัน "Unexpected end of JSON input" ตอน body ว่าง/HTML/truncated
    const responseText = await r.text();
    if (!responseText || !responseText.trim()) {
      throw new Error(`OpenRouter ${r.status}: empty response body (took ${took}ms) — credit หรือ network อาจมีปัญหา`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // OpenRouter อาจ return HTML error page (5xx, maintenance) แทน JSON
      throw new Error(`OpenRouter ${r.status} returned non-JSON: ${responseText.slice(0, 300)}`);
    }

    if (!r.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data).slice(0, 300);
      throw new Error(`OpenRouter ${r.status}: ${errMsg}`);
    }

    const { image_base64, image_url } = extractImage(data);
    if (!image_base64 && !image_url) {
      throw new Error(`No image in response — keys: ${Object.keys(data).join(',')}, content preview: ${JSON.stringify(data).slice(0, 200)}`);
    }

    await supabase
      .from('image_jobs')
      .update({
        status: 'done',
        image_base64,
        image_url,
        provider: 'openrouter-render',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[worker] ✅ job ${jobId} done in ${took}ms`);
  } catch (e) {
    console.error(`[worker] job ${jobId} failed:`, e.message);
    await supabase
      .from('image_jobs')
      .update({
        status: 'failed',
        error: String(e.message).slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

// ===== Same image-extraction logic as Supabase Edge Function =====
function extractImage(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return { image_base64: null, image_url: null };

  // 1. message.images[] (newer OpenRouter format)
  if (Array.isArray(message.images) && message.images.length > 0) {
    const img = message.images[0];
    const url = img?.image_url?.url || img?.url;
    if (url) {
      if (url.startsWith('data:image')) return { image_base64: url.split(',')[1], image_url: null };
      return { image_base64: null, image_url: url };
    }
  }

  // 2. message.content as array (vision-style)
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const url = part.image_url.url;
        if (url.startsWith('data:image')) return { image_base64: url.split(',')[1], image_url: null };
        return { image_base64: null, image_url: url };
      }
      if (part.type === 'image' && part.source?.data) {
        return { image_base64: part.source.data, image_url: null };
      }
    }
  }

  // 3. message.content as string (some models)
  if (typeof message.content === 'string') {
    const m = message.content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
    if (m) return { image_base64: m[1], image_url: null };
    const urlMatch = message.content.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp)/i);
    if (urlMatch) return { image_base64: null, image_url: urlMatch[0] };
  }

  // 4. tool_calls / function_call
  if (Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      try {
        const args =
          typeof tc.function?.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments;
        if (args?.image_base64) return { image_base64: args.image_base64, image_url: null };
        if (args?.image_url) return { image_base64: null, image_url: args.image_url };
      } catch {}
    }
  }

  return { image_base64: null, image_url: null };
}

app.listen(PORT, () => {
  console.log(`[worker] listening on :${PORT}`);
  console.log(`[worker] SUPABASE_URL: ${process.env.SUPABASE_URL ? 'set' : 'MISSING'}`);
  console.log(`[worker] OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING'}`);
  console.log(`[worker] WORKER_SECRET: ${process.env.WORKER_SECRET ? 'set' : 'MISSING (auth disabled)'}`);
});
