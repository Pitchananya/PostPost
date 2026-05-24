// public/js/data/video-models.js
//
// Text-to-Video model catalog used by pages/textvideo.js.
//
// VIDEO_MODELS — Veo + fal.ai t2v models the user can pick from. Sorted by
// recommended use: Wan 2.2 first (cheapest reliable, default). Veo 2 is free
// *if quota's available*, but quota gambling makes Wan 2.2 win for default.
//   - provider:'fal'  → routed through /api/ai/fal-t2v-submit (needs FAL_KEY)
//   - provider:'veo'  → routed through /api/ai/veo-generate (Google Gemini)
//
// VIDEO_STYLES — visual style presets (Creator, Cinematic, Lifestyle, …).
// The picked index maps to a style ID the backend understands via the
// styleIds array in genVideoPrompt: ['creator','cinematic','lifestyle','product','anime'].

export const VIDEO_MODELS = [
  { id:'fal-ai/wan/v2.2-a14b/text-to-video',              provider:'fal', name:'Wan 2.2',                  sub_th:'fal.ai · ~$0.30/คลิป · ถูกสุด เร็ว ลื่น (แนะนำ)',     sub_en:'fal.ai · ~$0.30 · cheapest reliable (recommended)', time_th:'~1-2 นาที', time_en:'~1-2 min', badge:'BEST DEAL' },
  { id:'veo-2.0-generate-001',                            provider:'veo', name:'Veo 2',                    sub_th:'Google · ฟรี ~2-5 คลิป/วัน · มาตรฐาน',                sub_en:'Google · free 2-5 clips/day',                 time_th:'~1-2 นาที', time_en:'~1-2 min', badge:'FREE' },
  { id:'fal-ai/luma-dream-machine',                       provider:'fal', name:'Luma Dream Machine',       sub_th:'fal.ai · ~$0.40/คลิป · character ดี ลื่น',             sub_en:'fal.ai · ~$0.40 · char consistency',          time_th:'~2 นาที',   time_en:'~2 min',   badge:'$0.40' },
  { id:'fal-ai/wan-2.5/text-to-video/preview',            provider:'fal', name:'Wan 2.5 (preview)',        sub_th:'fal.ai · ~$0.40/คลิป · รุ่นใหม่ ดีกว่า 2.2',            sub_en:'fal.ai · ~$0.40 · newer + better',            time_th:'~2 นาที',   time_en:'~2 min',   badge:'$0.40' },
  { id:'fal-ai/minimax/hailuo-02/standard/text-to-video', provider:'fal', name:'Hailuo 02',                sub_th:'fal.ai · ~$0.45/คลิป · cinematic 6 วินาที',            sub_en:'fal.ai · ~$0.45 · cinematic 6s',              time_th:'~2 นาที',   time_en:'~2 min',   badge:'$0.45' },
  { id:'fal-ai/kling-video/v2.5-turbo/pro/text-to-video', provider:'fal', name:'Kling 2.5 Turbo Pro',      sub_th:'fal.ai · ~$0.70/คลิป · premium cinematic',              sub_en:'fal.ai · ~$0.70 · premium cinematic',         time_th:'~3 นาที',   time_en:'~3 min',   badge:'$0.70' },
  { id:'veo-3.0-fast-generate-001',                       provider:'veo', name:'Veo 3 Fast',               sub_th:'Google · ~$0.80/คลิป · ลื่น คมชัด',                     sub_en:'Google · ~$0.80 · sharp',                     time_th:'~1-2 นาที', time_en:'~1-2 min', badge:'$0.80' },
  { id:'veo-3.0-generate-001',                            provider:'veo', name:'Veo 3 Pro',                sub_th:'Google · ~$3.20/คลิป · คุณภาพสูงสุด',                   sub_en:'Google · ~$3.20 · highest',                   time_th:'~2-3 นาที', time_en:'~2-3 min', badge:'$3.20' },
  { id:'veo-3.1-generate-preview',                        provider:'veo', name:'Veo 3.1 Pro (preview)',    sub_th:'Google · ~$3.20+ · ใหม่สุด',                             sub_en:'Google · ~$3.20+ · newest',                   time_th:'~3 นาที',   time_en:'~3 min',   badge:'$3.20' },
];

export const VIDEO_STYLES = [
  { id:'creator',  th:'Creator/UGC', en:'Creator/UGC', sub_th:'คนถือสินค้าทำคอนเทนต์', sub_en:'Person holds product', bg:'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  { id:'cinematic',th:'Cinematic',  en:'Cinematic',  sub_th:'ภาพยนตร์', sub_en:'Filmic',             bg:'linear-gradient(135deg,#1F2937,#6B7280)' },
  { id:'lifestyle',th:'Lifestyle',  en:'Lifestyle',  sub_th:'ใช้จริงในชีวิต', sub_en:'Real-use',     bg:'linear-gradient(135deg,#FED7AA,#FB923C)' },
  { id:'product',  th:'Product',    en:'Product',    sub_th:'เน้นสินค้า', sub_en:'Product-focus',    bg:'linear-gradient(135deg,#FBCFE8,#DB2777)' },
  { id:'anime',    th:'Anime/3D',   en:'Anime/3D',   sub_th:'การ์ตูน', sub_en:'Animated',            bg:'linear-gradient(135deg,#C7D2FE,#818CF8)' },
];
