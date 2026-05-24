// public/js/idb.js
//
// Minimal IndexedDB wrapper used for storing draft images at full quality —
// localStorage's ~5MB quota is too small to keep more than a handful of
// base64 PNG/JPGs, but IndexedDB can comfortably hold hundreds.
//
// Single DB `postpost-images` with one object store `images` keyed by
// arbitrary strings (draft IDs, avatar IDs). Three operations: put / get /
// delete. The connection is lazy-opened and cached.
//
//   import { idbPutImage, idbGetImage, idbDeleteImage } from './idb.js';
//   await idbPutImage('avatar:abc', dataUrl);
//   const back = await idbGetImage('avatar:abc');

let _idbPromise = null;

function _openDb() {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open('postpost-images', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('images'); };
    req.onsuccess = () => { resolve(req.result); };
    req.onerror = () => { reject(req.error); };
  });
  return _idbPromise;
}

export async function idbPutImage(key, val) {
  const db = await _openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetImage(key) {
  const db = await _openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readonly');
    const req = tx.objectStore('images').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDeleteImage(key) {
  const db = await _openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Generic data-URL down-scaler — used to compress oversized base64 images
// before stashing them in localStorage (avatar tiles, draft thumbnails).
// Returns the original dataUrl unmodified if the input isn't a data URL
// or if anything goes wrong (defensive — we'd rather store the big one
// than lose the image).
export function compressImageDataUrl(dataUrl, maxDim, quality) {
  maxDim = maxDim || 360;
  quality = quality || 0.7;
  return new Promise((resolve) => {
    if (!dataUrl || dataUrl.indexOf('data:') !== 0) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      let w = img.width || maxDim;
      let h = img.height || maxDim;
      const s = Math.min(1, maxDim / Math.max(w, h));
      w = Math.max(1, Math.round(w * s));
      h = Math.max(1, Math.round(h * s));
      try {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      } catch (_) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
