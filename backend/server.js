import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import { app } from './app.js';
import { runDueAutomations } from './routes/automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
// SPA fallback — any non-API, non-file route returns the app shell
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

cron.schedule('* * * * *', async () => {
  try { await runDueAutomations(); }
  catch (e) { console.error('[cron]', e.message); }
});

app.listen(PORT, () => {
  console.log(`✅ PostPost listening on http://localhost:${PORT}`);
  console.log(`\n🔑 API Keys loaded:`);
  console.log(`   OPENROUTER_API_KEY:  ${process.env.OPENROUTER_API_KEY ? '✅ set (' + process.env.OPENROUTER_API_KEY.slice(0, 12) + '...)' : '❌ MISSING'}`);
  console.log(`   OPENAI_API_KEY:      ${process.env.OPENAI_API_KEY ? '✅ set (' + process.env.OPENAI_API_KEY.slice(0, 12) + '...)' : '❌ not set'}`);
  console.log(`   GOOGLE_AI_API_KEY:   ${process.env.GOOGLE_AI_API_KEY ? '✅ set (' + process.env.GOOGLE_AI_API_KEY.slice(0, 12) + '...)' : '❌ not set'}`);
  console.log(`   SUPABASE_SERVICE:    ${process.env.SUPABASE_SERVICE_KEY ? '✅ set' : '❌ MISSING'}`);

  const imgModel = process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5.4-image-2';
  let imgRoute = 'OpenRouter (proxy)';
  if (process.env.OPENAI_API_KEY && /^openai\/(gpt-image|dall-e)/i.test(imgModel)) imgRoute = '🚀 OpenAI direct';
  else if (process.env.GOOGLE_AI_API_KEY && /^google\/(gemini.*image|imagen)/i.test(imgModel)) imgRoute = '🚀 Google AI direct';
  console.log(`\n🎨 Image model: ${imgModel} → ${imgRoute}`);

  // GPT-5.4 จำเป็นต้องใช้ async (Edge Function) เพราะเกิน Vercel 60s timeout
  if (/gpt-5\.4-image/i.test(imgModel)) {
    const edgeOk = !!(process.env.SUPABASE_EDGE_URL && process.env.WORKER_SECRET);
    console.log(`   Async worker:   ${edgeOk ? '✅ configured' : '⚠️  SUPABASE_EDGE_URL / WORKER_SECRET missing — /image-async will stay pending'}`);
  }
  console.log('');
});
