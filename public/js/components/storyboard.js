// public/js/components/storyboard.js
//
// Talking-Avatar storyboard helpers.
//
//   splitScriptIntoChunks(script, n) → string[N]
//     Pure function. Splits a Thai script into N approximately-equal
//     chunks by sentence/clause boundary. Tokenizes on punctuation +
//     Thai sentence-ender particles (ครับ / ค่ะ / นะคะ / นะครับ), then
//     re-groups tokens into N buckets of ~equal total character count.
//     Falls back to even char split with word-boundary awareness when
//     there are too few tokens.
//
// genStoryboard, searchSlotBg, and the per-slot click handlers still
// live inline in index.html — they reach into render(), toast(), and
// the API helpers, and the inline event-delegation router still owns
// the click routing. Phase 3e will lift them into this module along
// with their event handlers (right now they'd duplicate the inline
// definitions and we'd have two handlers firing per click).

export function splitScriptIntoChunks(script, n) {
  script = String(script || '').trim();
  if (n <= 1) return [script];
  // Forward-match sentence-ish chunks ending in punctuation or Thai particles.
  // No lookbehind — keeps parser-compat with older script-check tools.
  const sentenceRe = new RegExp('[^.!?\\n]+?(?:[.!?]+|ครับ|ค่ะ|นะคะ|นะครับ|$)', 'g');
  const matches = script.match(sentenceRe) || [];
  const tokens = matches.map((s) => s.trim()).filter(Boolean);
  if (tokens.length < n) {
    // Fall back to even char split with word-boundary awareness
    const step = Math.ceil(script.length / n);
    const out = [];
    let i = 0;
    while (i < script.length && out.length < n) {
      let end = Math.min(script.length, i + step);
      if (end < script.length) {
        const sp = script.lastIndexOf(' ', end);
        if (sp > i + step * 0.6) end = sp;
      }
      out.push(script.slice(i, end).trim());
      i = end;
    }
    while (out.length < n) out.push('');
    return out;
  }
  // Re-group tokens into N buckets of ~equal total length
  const target = script.length / n;
  const buckets = [];
  let current = '';
  let curLen = 0;
  tokens.forEach((s) => {
    if (curLen >= target && buckets.length < n - 1) {
      buckets.push(current.trim()); current = ''; curLen = 0;
    }
    current += s + ' ';
    curLen += s.length;
  });
  if (current) buckets.push(current.trim());
  while (buckets.length < n) buckets.push('');
  return buckets.slice(0, n);
}
