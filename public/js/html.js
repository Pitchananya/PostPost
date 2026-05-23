// public/js/html.js
//
// Tiny tagged-template engine — replaces ad-hoc string concat for HTML.
// Auto-escapes all interpolated values to neutralize XSS from state-derived
// content. Trusted HTML (icons, pre-rendered cards, computed innerHTML) opt
// out via raw().
//
//   import { html, raw, escape } from './html.js';
//   const safe   = html`<div>${userName}</div>`;          // escaped
//   const trust  = html`<div>${raw(svgString)}</div>`;    // not escaped
//   const list   = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
//                                                         // arrays joined
//
// Safety model:
//   - Plain values (strings, numbers) → HTML-escaped via escape().
//   - null / undefined / false       → emit nothing (handy for conditionals).
//   - Arrays                          → join('') with no separator. Nested
//                                       html`` results are already strings,
//                                       so this preserves the common
//                                       `.map(x => html\`…\`)` pattern.
//   - raw(x)                          → inserted verbatim. Use ONLY for
//                                       trusted, pre-escaped HTML (icons,
//                                       static markup, recursive html``
//                                       results passed through helpers).
//   - true                            → emits the literal "true". Wrap with
//                                       `cond && html\`…\`` to gate output.

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null || v === false) {
      out += '';
    } else if (v && typeof v === 'object' && v.__rawHtml === true) {
      out += v.value;
    } else if (Array.isArray(v)) {
      out += v.join('');
    } else {
      out += escape(v);
    }
    out += strings[i + 1];
  }
  return out;
}

export function raw(value) {
  return { __rawHtml: true, value: String(value == null ? '' : value) };
}

export function escape(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
