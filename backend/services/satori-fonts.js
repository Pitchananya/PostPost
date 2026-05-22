import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '..', 'fonts');

// โหลด TTF เป็น Buffer ครั้งเดียวตอน import
const buf = (file) => fs.readFileSync(path.join(FONTS_DIR, file));

// satori รับ fonts: Array<{ name, data, weight, style }>
export const SATORI_FONTS = [
  { name: 'Prompt', data: buf('Prompt-Bold.ttf'),       weight: 700, style: 'normal' },
  { name: 'Prompt', data: buf('Prompt-ExtraBold.ttf'),  weight: 800, style: 'normal' },
  { name: 'IBM Plex Sans Thai', data: buf('IBMPlexSansThai-Regular.ttf'),  weight: 400, style: 'normal' },
  { name: 'IBM Plex Sans Thai', data: buf('IBMPlexSansThai-SemiBold.ttf'), weight: 600, style: 'normal' },
];

// strip emoji ที่ font ไทยไม่ support → กัน □□
export function stripEmoji(text = '') {
  return String(text)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27FF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/‍/g, '')
    .trim();
}

// JSX-like helper — h(tag, props, ...children) → satori tree
export function h(type, props = {}, ...children) {
  const flat = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      children: flat.length === 0 ? undefined : flat.length === 1 ? flat[0] : flat,
    },
  };
}
