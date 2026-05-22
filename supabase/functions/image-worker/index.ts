// Supabase Edge Function: image-worker
// รับ job_id → ดึง prompt จาก DB → ยิง OpenRouter GPT-5.4 → save result
// Timeout: 150s (Edge Function default — เพียงพอกว่า Vercel 60s)
//
// Deploy: supabase functions deploy image-worker --no-verify-jwt
// Secrets: supabase secrets set OPENROUTER_API_KEY=sk-or-... WORKER_SECRET=<random-token>

import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

// ============== Image extraction helper ==============
function extractImage(data: any): { image_base64: string | null; image_url: string | null } {
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
        const args = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function?.arguments;
        if (args?.image_base64) return { image_base64: args.image_base64, image_url: null };
        if (args?.image_url) return { image_base64: null, image_url: args.image_url };
      } catch {}
    }
  }

  return { image_base64: null, image_url: null };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  // Auth — WORKER_SECRET ป้องกัน abuse (function ต้อง deploy with --no-verify-jwt)
  const auth = req.headers.get('authorization') || '';
  const expected = Deno.env.get('WORKER_SECRET');
  if (expected && auth !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let job_id: number | null = null;
  try {
    const body = await req.json();
    job_id = Number(body.job_id);
    if (!job_id) {
      return new Response(JSON.stringify({ error: 'job_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. โหลด job
  const { data: job, error: fetchErr } = await supabase
    .from('image_jobs')
    .select('id, prompt, model, status')
    .eq('id', job_id)
    .maybeSingle();

  if (fetchErr || !job) {
    return new Response(JSON.stringify({ error: 'job not found', detail: fetchErr?.message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Skip if already done/processing (idempotency — กัน double-trigger)
  if (job.status === 'done' || job.status === 'processing') {
    return new Response(JSON.stringify({ ok: true, skipped: true, status: job.status }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Mark processing
  await supabase.from('image_jobs').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('id', job_id);

  // 3. Call OpenRouter
  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in Edge Function secrets');

    const model = job.model || 'openai/gpt-5.4-image-2';
    const fullPrompt = `Create a high-quality image: ${job.prompt}.

Style: warm, professional. Aspect: vertical 4:5. Maximum quality, photorealistic detail.`;

    // ⏱️ Hard timeout 135s — leave ~15s headroom before Supabase free-tier 150s
    // wall-clock kills the function, so we can still update DB to 'failed'
    // instead of leaving the row stuck in 'processing' forever.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort('openrouter timeout 135s'), 135_000);

    const t0 = Date.now();
    let r: Response;
    try {
      r = await fetch(OPENROUTER_API, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://oem-content-factory.vercel.app',
          'X-Title': 'OEM Content Factory',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          modalities: ['image', 'text'],
          // 8192 tokens still produces a full image; halving it cuts wall-clock
          // by ~30-40% so we usually finish well inside the 135s budget.
          max_tokens: 8192,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await r.json();
    const took = Date.now() - t0;
    console.log(`[image-worker] ${model} took=${took}ms status=${r.status}`);

    if (!r.ok) {
      throw new Error(`OpenRouter ${r.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }

    const { image_base64, image_url } = extractImage(data);
    if (!image_base64 && !image_url) {
      throw new Error(`No image in response — keys: ${Object.keys(data).join(',')}`);
    }

    // 4. Save result
    await supabase.from('image_jobs').update({
      status: 'done',
      image_base64,
      image_url,
      provider: 'openrouter',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', job_id);

    return new Response(JSON.stringify({ ok: true, job_id, model, took_ms: took }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[image-worker] error:', e.message);
    await supabase.from('image_jobs').update({
      status: 'failed',
      error: String(e.message).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq('id', job_id);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
