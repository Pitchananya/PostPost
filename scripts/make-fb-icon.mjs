// Make a Facebook-compliant App Icon from any logo image.
//
// Facebook rejects icons that aren't a plain square RGB image: an alpha
// channel, a non-sRGB colour profile (display-P3 etc.), or odd dimensions
// can all surface as the generic "เกิดข้อผิดพลาด — โปรดลองรีเฟรช" upload
// error. This normalises the input to what FB always accepts:
//   1024×1024, sRGB, no transparency (flattened on white), metadata stripped.
//
// Usage:
//   node scripts/make-fb-icon.mjs <input-image> [output-basename]
//   node scripts/make-fb-icon.mjs ./logo.png
//   → writes logo.fb-icon-1024.png  AND  logo.fb-icon-1024.jpg
//
// Upload the PNG first; if FB still balks, try the JPG (no alpha at all).

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/make-fb-icon.mjs <input-image> [output-basename]');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const dir = path.dirname(input);
const base = process.argv[3] || path.basename(input).replace(/\.[^.]+$/, '');
const outPng = path.join(dir, `${base}.fb-icon-1024.png`);
const outJpg = path.join(dir, `${base}.fb-icon-1024.jpg`);

// contain (not cover) so the logo is never cropped; pad to square with white.
const pipeline = (file) =>
  sharp(file)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .flatten({ background: '#ffffff' })   // drop any alpha → solid white bg
    .toColourspace('srgb');               // force sRGB (FB chokes on P3/CMYK)

const run = async () => {
  const meta = await sharp(input).metadata();
  console.log(`input: ${meta.width}×${meta.height} ${meta.format} alpha=${!!meta.hasAlpha} space=${meta.space}`);

  await pipeline(input).png({ compressionLevel: 9 }).toFile(outPng);
  await pipeline(input).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(outJpg);

  for (const f of [outPng, outJpg]) {
    const kb = Math.round(fs.statSync(f).size / 1024);
    console.log(`✓ ${f}  (${kb} KB)`);
  }
  console.log('\nUpload the .png in FB → Settings → Basic → App Icon. If it still errors, upload the .jpg.');
};

run().catch((e) => { console.error('failed:', e.message); process.exit(1); });
