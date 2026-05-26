-- Migration 017: events table — telemetry for the PostPost UI
-- Run in Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- Captures user-facing events from the frontend (page views, content gen,
-- brand switch, topic-bank usage, etc.). The Analytics page reads this
-- to replace the Phase-3 mock numbers with real per-tenant activity.
--
-- Design choices:
--   • Self-contained — no FK to users/tenants so this migration can run
--     before / independent of 016. tenant_id defaults to 1 (single-tenant
--     bootstrap value) so events from un-migrated installs still land.
--   • props is jsonb so each event type can carry its own shape without
--     needing a new column / new migration per event.
--   • Two composite indexes cover the dominant Analytics-page queries:
--     "events for tenant X in last N days" and "events of kind Y for
--     tenant X in last N days".
--
-- ⚠️ Idempotent — safe to re-run.

create table if not exists public.events (
  id          bigserial primary key,
  tenant_id   bigint not null default 1,
  user_id     bigint,
  name        text not null,
  props       jsonb not null default '{}'::jsonb,
  page        text,
  session_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists events_tenant_time on public.events(tenant_id, created_at desc);
create index if not exists events_tenant_name_time on public.events(tenant_id, name, created_at desc);

-- Retention helper — Analytics page reads only the last 90 days. Older
-- rows can be pruned manually or via a scheduled job. Not enforced here.
comment on table public.events is 'UI telemetry — see backend/routes/events.js for ingest';
