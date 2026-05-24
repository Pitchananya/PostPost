// public/js/auth.js
//
// JWT token persistence — single source of truth for the `postpost_token`
// localStorage key. Importers should NEVER touch localStorage directly for
// auth; route through here so we can swap to httpOnly cookies later
// without hunting down call sites.
//
//   import { getTok, setTok, clearTok } from './auth.js';
//
// All three helpers swallow localStorage errors (private-mode Safari, etc.)
// so the UI keeps working even when storage is unavailable.

const KEY = 'postpost_token';

export function getTok() {
  try { return localStorage.getItem(KEY) || ''; }
  catch (_) { return ''; }
}

export function setTok(token) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch (_) {}
}

export function clearTok() {
  setTok('');
}
