// public/js/i18n.js
//
// Tiny i18n helpers — `T(th, en)` for inline pair-of-strings, `t({th, en})`
// for object-shaped labels. Language lives in state.lang.
//
// Module dependency note: i18n READS from state but state.js doesn't import
// i18n, so importing state directly here would force a one-way edge. We
// keep it loose with `bindState(state)` — main.js wires the reference in
// during boot. That keeps both modules circular-free and unit-testable.
//
//   import * as i18n from './i18n.js';
//   import { state }  from './state.js';
//   i18n.bindState(state);
//   const label = i18n.T('สวัสดี', 'Hello');

// Default to a `th`-anchored reference until main.js calls bindState().
// Most callers run AFTER bindState, but a few early imports may hit this
// fallback — defaulting to 'th' matches the existing inline-script start.
let _stateRef = { lang: 'th' };

export function bindState(stateObj) {
  _stateRef = stateObj;
}

export function getLang() {
  return _stateRef.lang;
}

export function setLang(lang) {
  _stateRef.lang = lang;
}

export const T = (th, en) => (_stateRef.lang === 'th' ? th : en);

export const t = (obj) =>
  typeof obj === 'object'
    ? (_stateRef.lang === 'th' ? obj.th : obj.en)
    : obj;
