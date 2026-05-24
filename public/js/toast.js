// public/js/toast.js
//
// Transient bottom-right notification. Self-contained — appends a styled
// <div> to document.body, auto-fades after 3.8s. Three kinds:
//   - 'info'    (default) → orange accent
//   - 'success'           → green accent
//   - 'error'             → red accent
//
//   import { toast } from './toast.js';
//   toast('บันทึกแล้ว', 'success');
//
// No state dependency; safe to import from any module.

export function toast(msg, kind = 'info') {
  const d = document.createElement('div');
  d.textContent = msg;
  const bar = kind === 'error' ? '#DC2626'
            : kind === 'success' ? '#16A34A'
            : '#FF7A1A';
  d.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;background:#fff;'
    + 'border:1px solid #E9DCCB;border-left:3px solid ' + bar + ';border-radius:12px;padding:12px 16px;'
    + 'font:600 13px/1.45 Prompt,sans-serif;color:#261447;box-shadow:0 12px 34px rgba(38,20,71,.18);max-width:360px';
  document.body.appendChild(d);
  setTimeout(() => {
    d.style.transition = 'opacity .3s';
    d.style.opacity = '0';
    setTimeout(() => { d.remove(); }, 320);
  }, 3800);
}
