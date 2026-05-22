import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SATORI_FONTS } from './satori-fonts.js';
import { buildHeroPoster, buildQnaCard, buildFeatureGrid } from './templates.js';

const TEMPLATES = {
  'hero-poster': buildHeroPoster,
  'qna-card': buildQnaCard,
  'feature-grid': buildFeatureGrid,
};

export async function composeImage({ baseImageBuffer, template = 'hero-poster', data = {} }) {
  const builder = TEMPLATES[template];
  if (!builder) throw new Error(`Unknown template: ${template}`);

  const { width = 1080, height = 1080 } = builder.size || {};

  // Step 1: resize base image ให้ตรงกับ canvas
  const baseResized = await sharp(baseImageBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Step 2: Satori → SVG (handle Thai shaping ถูกต้อง)
  const tree = builder(data);
  const svg = await satori(tree, {
    width, height,
    fonts: SATORI_FONTS,
    embedFont: true,
  });

  // Step 3: SVG → PNG ด้วย resvg (resvg มี Thai support ดี)
  const pngBuffer = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
  }).render().asPng();

  // Step 4: composite overlay onto base image
  return sharp(baseResized)
    .composite([{ input: pngBuffer, top: 0, left: 0 }])
    .png({ compressionLevel: 9, quality: 92 })
    .toBuffer();
}

export async function fetchImageBuffer(input) {
  if (input.image_base64) return Buffer.from(input.image_base64, 'base64');
  if (input.image_url) {
    const r = await fetch(input.image_url);
    if (!r.ok) throw new Error(`fetch base image ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error('no image_base64 or image_url');
}
