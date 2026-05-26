// public/js/track.js
//
// Lightweight client-side event tracker. Frontend feeds the Analytics
// page (and any future funnel/cohort tooling) by emitting named events
// from key callsites; this module batches them in memory and flushes to
// POST /api/events every ~4s (or on visibility change / page unload).
//
// Usage:
//   import { track, trackPageView } from './track.js';
//   track('topic_used', { topicId: 'F3', kind: 'promo' });
//   trackPageView('caption');
//
// Also exposes window.PP.track for inline event handlers in index.html.
//
// Design notes:
//   • Events from logged-OUT sessions are dropped on flush (backend
//     requires auth). They don't pile up in the queue indefinitely.
//   • Network failures push the batch back onto the queue and retry
//     after a longer delay — so a flaky connection doesn't lose data.
//   • session_id lives in sessionStorage so it survives tab reloads
//     but resets per browser tab. Useful for "same session" funnels.
//   • Page tracking is wired in render.js (page change → page_view).

import { api } from './api.js';
import { getTok } from './auth.js';

const QUEUE = [];
let FLUSH_TIMER = null;
let SESSION = null;
let LAST_TRACKED_PAGE = null;
// Circuit breaker — after this many consecutive flush failures we assume
// the backend isn't reachable (server down, /api/events not deployed,
// migration not run) and stop trying. Re-enabled on next page load.
let CONSECUTIVE_FAILURES = 0;
const MAX_FAILURES = 3;
let DISABLED = false;

function sessionId() {
  if (SESSION) return SESSION;
  try {
    SESSION = sessionStorage.getItem('pp_session_id');
    if (!SESSION) {
      SESSION = 'sess_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('pp_session_id', SESSION);
    }
  } catch (_) {
    SESSION = 'sess_' + Date.now().toString(36);
  }
  return SESSION;
}

function currentPage() {
  try { return (window.PP && window.PP.state && window.PP.state.page) || null; }
  catch (_) { return null; }
}

export function track(name, props) {
  if (!name || DISABLED) return;
  QUEUE.push({
    name: String(name).slice(0, 100),
    props: (props && typeof props === 'object') ? props : {},
    page: currentPage(),
    session_id: sessionId(),
  });
  scheduleFlush();
}

// Called by render.js after every page change. De-dupes consecutive renders
// of the same page (a button-click re-render isn't a new page view).
export function trackPageView(page) {
  if (!page || page === LAST_TRACKED_PAGE) return;
  LAST_TRACKED_PAGE = page;
  track('page_view', { page });
}

function scheduleFlush() {
  if (FLUSH_TIMER || DISABLED) return;
  FLUSH_TIMER = setTimeout(flush, 4000);
}

async function flush() {
  FLUSH_TIMER = null;
  if (DISABLED) { QUEUE.length = 0; return; }
  if (!QUEUE.length) return;
  if (!getTok()) {
    // Not logged in — don't accumulate events forever. Drop and move on.
    QUEUE.length = 0;
    return;
  }
  const batch = QUEUE.splice(0, QUEUE.length);
  try {
    await api('/api/events', { method: 'POST', body: { events: batch } });
    CONSECUTIVE_FAILURES = 0;          // healthy response — reset breaker
  } catch (e) {
    CONSECUTIVE_FAILURES += 1;
    if (CONSECUTIVE_FAILURES >= MAX_FAILURES) {
      // Trip the breaker. Common cause: migration-017-events.sql hasn't
      // been run in Supabase yet (table missing → backend used to 500;
      // now it returns 200 with a warning, but for older deploys we still
      // hit this branch). Drop the queue and stop firing flushes for the
      // rest of this page load.
      DISABLED = true;
      QUEUE.length = 0;
      console.warn('[track] disabled after', MAX_FAILURES, 'consecutive failures —', e.message);
      return;
    }
    // Transient hiccup — re-enqueue and retry after a longer wait.
    // Don't schedule via scheduleFlush here (would create chained timers
    // if scheduleFlush is invoked again by an inbound track() call);
    // schedule the flush directly to keep at most one pending timer.
    QUEUE.unshift(...batch);
    if (!FLUSH_TIMER) FLUSH_TIMER = setTimeout(flush, 10_000);
  }
}

// Flush opportunistically when the tab goes to background / unloads so
// we don't lose the last few events of a session.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);
}

// Expose for inline event handlers in index.html (which can't import).
if (typeof window !== 'undefined') {
  window.PP = window.PP || {};
  window.PP.track = track;
  window.PP.trackPageView = trackPageView;
}
