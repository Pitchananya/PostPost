// public/js/components/chroma-key.js
//
// Talking-Avatar chroma-key compositor — extracts the per-frame green/black
// background removal from the lipsync video into a reusable utility.
//
//   detectChromaMode(src, workCanvas) → 'green' | 'black' | 'none'
//     Samples 4 corner pixels of the source. Returns:
//       'green' — >= 3 corners are bright green chroma (#00FF00 family).
//       'black' — >= 3 corners are near-black (fal.ai default backdrop).
//       'none'  — regular photo bg (caller should circle-clip instead).
//
//   makeChromaKeyer(workCanvas, mode, workW, workH) → (src) => HTMLCanvasElement
//     Returns a per-frame keyer. The returned fn draws `src` (img/video) into
//     the workCanvas at workW×workH, replaces matching pixels with
//     transparency, and returns the workCanvas ready to drawImage onto the
//     main render canvas. The workCanvas is REUSED across calls — no
//     per-frame allocation.
//
// Per the production brief, GREEN (#00FF00) is the primary chroma color.
// BLACK is supported automatically for fal.ai outputs so legacy workflows
// still composite cleanly.
//
// Currently UNUSED — the canvas compositor inside genAvatarVideo (in
// index.html) still inlines the same logic in a closure (it needs to share
// the offscreen canvas + mode flag with the per-frame draw loop, and the
// loop captures audioCtx + analyser + scenes via lexical scope). Phase 3e
// will lift genAvatarVideo into a module and swap that closure for these
// exports. Keeping the canonical impl here so the eventual move is just
// a swap, not a re-derivation.

export function detectChromaMode(src, workCanvas) {
  if (!src) return 'none';
  const cx = workCanvas.getContext('2d', { willReadFrequently: true });
  try {
    const sw = src.videoWidth || src.naturalWidth || 256;
    const sh = src.videoHeight || src.naturalHeight || 256;
    workCanvas.width = Math.min(sw, 256);
    workCanvas.height = Math.min(sh, 256);
    cx.drawImage(src, 0, 0, workCanvas.width, workCanvas.height);
    const samples = [
      cx.getImageData(2, 2, 1, 1).data,
      cx.getImageData(workCanvas.width - 3, 2, 1, 1).data,
      cx.getImageData(2, workCanvas.height - 3, 1, 1).data,
      cx.getImageData(workCanvas.width - 3, workCanvas.height - 3, 1, 1).data,
    ];
    let greenCount = 0;
    let blackCount = 0;
    for (let si = 0; si < samples.length; si++) {
      const pr = samples[si][0];
      const pg = samples[si][1];
      const pb = samples[si][2];
      if (pg > 110 && pg > pr * 1.3 && pg > pb * 1.3) greenCount++;
      if (pr < 25 && pg < 25 && pb < 25) blackCount++;
    }
    if (greenCount >= 3) return 'green';
    if (blackCount >= 3) return 'black';
    return 'none';
  } catch (_) {
    return 'none';
  }
}

export function makeChromaKeyer(workCanvas, mode, workW = 480, workH = 480) {
  const cx = workCanvas.getContext('2d', { willReadFrequently: true });
  return function chromaKeyFrame(src) {
    workCanvas.width = workW;
    workCanvas.height = workH;
    cx.clearRect(0, 0, workW, workH);
    // Cover-fit: square crop centered on the face (top portion of portrait)
    const sw = src.videoWidth || src.naturalWidth || workW;
    const sh = src.videoHeight || src.naturalHeight || workH;
    const sr = sw / sh;
    let dw, dh, dx, dy;
    if (sr >= 1) {
      dh = workH; dw = dh * sr; dx = (workW - dw) / 2; dy = 0;
    } else {
      dw = workW; dh = dw / sr; dx = 0;
      dy = -(dh - workH) * 0.18;     // shift face up like the static crop
    }
    cx.drawImage(src, dx, dy, dw, dh);
    const imgData = cx.getImageData(0, 0, workW, workH);
    const d = imgData.data;
    if (mode === 'green') {
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (g > 80 && g > r * 1.15 && g > b * 1.15) {
          const greenness = (g - Math.max(r, b));      // 0..255
          if (greenness > 60)       d[i + 3] = 0;       // pure green → transparent
          else if (greenness > 20)  d[i + 3] = Math.max(0, 255 - greenness * 4);
          // Spill suppress: pull green channel down toward avg(r,b)
          if (greenness > 10) d[i + 1] = Math.round((r + b) / 2);
        }
      }
    } else if (mode === 'black') {
      for (let i2 = 0; i2 < d.length; i2 += 4) {
        const lum = 0.299 * d[i2] + 0.587 * d[i2 + 1] + 0.114 * d[i2 + 2];
        if (lum < 22)      d[i2 + 3] = 0;
        else if (lum < 50) d[i2 + 3] = Math.round((lum - 22) / 28 * 255);
      }
    }
    cx.putImageData(imgData, 0, 0);
    return workCanvas;
  };
}
