// public/js/api.js
//
// Thin fetch wrapper — adds the JWT Authorization header from auth.js,
// serializes JSON bodies, throws a friendly Error on non-2xx responses.
//
//   import { api, apiAt } from './api.js';
//   const me = await api('/api/auth/me');
//   const remote = await apiAt('http://localhost:3000', '/api/health');
//
// `api(path)` hits the same origin (API_BASE = ''), which matches the
// Vercel deployment topology. `apiAt(baseUrl, path)` lets us hit a
// different host — used by the "Use my machine" scraper toggle.

import { getTok } from './auth.js';

// Empty string = same-origin. Kept as an exported constant so future code
// (or a built-step) can flip it without editing call sites.
export const API_BASE = '';

export async function api(path, opts) {
  opts = opts || {};
  const h = {};
  if (opts.body !== undefined) h['Content-Type'] = 'application/json';
  const tk = getTok();
  if (tk) h['Authorization'] = 'Bearer ' + tk;
  const fullUrl = API_BASE + path;
  const method = opts.method || 'GET';
  let res;
  try {
    res = await fetch(fullUrl, {
      method,
      headers: h,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (_) {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    // Log the exact failing URL + method to the console so 404s show their source
    // (was opaque before — "Failed to load resource" with no url in the browser default log).
    console.warn('[api] ' + method + ' ' + path + ' → ' + res.status + ' ' + res.statusText, data || '');
    throw new Error((data && (data.message || data.error)) || (res.status + ' ' + res.statusText));
  }
  return data;
}

// Same as api() but lets the caller pick an arbitrary baseUrl. Used by the
// local-scraper escape hatch (http://localhost:3000) — same JWT secret on
// both ends, so the token from getTok() works for the local agent too.
export async function apiAt(baseUrl, path, opts) {
  opts = opts || {};
  const h = {};
  if (opts.body !== undefined) h['Content-Type'] = 'application/json';
  const tk = getTok();
  if (tk) h['Authorization'] = 'Bearer ' + tk;
  const res = await fetch(baseUrl + path, {
    method: opts.method || 'GET',
    headers: h,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error((data && (data.message || data.error)) || (res.status + ' ' + res.statusText));
  return data;
}
