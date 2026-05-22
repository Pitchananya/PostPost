-- PostPost — full Supabase setup (schema + migrations)
-- Run this whole file once in the Supabase SQL Editor.
-- NOTE: migration-008 (pg_cron) is intentionally excluded — scheduling is
-- handled by node-cron (local) / Vercel Cron (deploy); no extension needed.

-- ===================================================================
-- schema.sql
-- ===================================================================
-- OEM Content Factory — Supabase Schema
-- รันไฟล์นี้ใน Supabase SQL Editor (Project → SQL Editor → New query → Run)

-- =========== leads ===========
create table if not exists public.leads (
  id           bigserial primary key,
  course       text not null check (course in ('PFB','PHE','GURU')),
  name         text not null,
  phone        text not null,
  email        text,
  line_id      text,
  source       text default 'direct',
  status       text,                       -- newbie / petshop / brand / investor / other
  budget       text,                       -- <1m / 1-3m / 3-5m / 5-10m / >10m
  message      text,
  created_at   timestamptz default now()
);
create index if not exists leads_course_idx on public.leads(course);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- =========== contents ===========
create table if not exists public.contents (
  id            bigserial primary key,
  course        text not null check (course in ('PFB','PHE','GURU')),
  topic         text,
  framework     text default 'F1',
  hook          text not null,
  caption       text,
  media_url     text,
  platforms     text[] default '{facebook}',
  status        text default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at  timestamptz default now(),
  published_at  timestamptz,
  last_error    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists contents_status_sched_idx on public.contents(status, scheduled_at);
create index if not exists contents_course_idx on public.contents(course);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_contents_updated on public.contents;
create trigger trg_contents_updated before update on public.contents
for each row execute function set_updated_at();

-- =========== automation_logs ===========
create table if not exists public.automation_logs (
  id          bigserial primary key,
  content_id  bigint references public.contents(id) on delete set null,
  platform    text,
  success     boolean default false,
  message     text,
  payload     jsonb,
  created_at  timestamptz default now()
);
create index if not exists logs_created_idx on public.automation_logs(created_at desc);

-- =========== admin_users (optional) ===========
create table if not exists public.admin_users (
  id            bigserial primary key,
  email         text unique not null,
  password_hash text not null,
  role          text default 'admin',
  created_at    timestamptz default now()
);

-- =========== settings (brand voice + misc config) ===========
create table if not exists public.settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz default now()
);

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
for each row execute function set_updated_at();
alter table public.settings enable row level security;

-- =========== RLS (lock down all tables — backend uses service_role) ===========
alter table public.leads enable row level security;
alter table public.contents enable row level security;
alter table public.automation_logs enable row level security;
alter table public.admin_users enable row level security;


-- ===================================================================
-- migration-002-scheduling.sql
-- ===================================================================
-- Migration 002: เพิ่ม fields สำหรับ scheduling + auto-post
-- รันใน Supabase SQL Editor — ปลอดภัย rerun ได้

-- เก็บ image_base64 (สำหรับ scheduled posts ที่ยังไม่ได้ upload)
alter table public.contents add column if not exists image_base64 text;

-- track retry สำหรับ scheduled post ที่ล้มเหลว
alter table public.contents add column if not exists retry_count int default 0;
alter table public.contents add column if not exists last_attempt_at timestamptz;

-- platform-level posting result (เก็บผล post แต่ละ platform แยก)
alter table public.contents add column if not exists post_results jsonb default '{}';

-- index สำหรับ cron scan (เร็วขึ้น)
create index if not exists contents_due_idx on public.contents(status, scheduled_at)
  where status = 'scheduled';

-- ตรวจ migration สำเร็จ
do $$ begin
  raise notice 'Migration 002 applied successfully';
  raise notice 'New columns: image_base64, retry_count, last_attempt_at, post_results';
end $$;


-- ===================================================================
-- migration-003-analytics.sql
-- ===================================================================
-- Migration 003: เพิ่ม fields สำหรับ analytics caching
-- รันใน Supabase SQL Editor — ปลอดภัย rerun ได้

-- cached metrics จาก FB/IG insights (เก็บไว้ไม่ต้อง fetch ทุกครั้ง)
alter table public.contents add column if not exists cached_metrics jsonb default '{}';
alter table public.contents add column if not exists metrics_fetched_at timestamptz;

-- index สำหรับ analytics queries
create index if not exists contents_published_at_idx on public.contents(published_at desc)
  where status = 'published';

create index if not exists leads_created_at_idx on public.leads(created_at desc);

do $$ begin
  raise notice 'Migration 003 applied — analytics caching ready';
end $$;


-- ===================================================================
-- migration-004-guru-course.sql
-- ===================================================================
-- Migration 004: Allow 'GURU' course (อาจารย์หนึ่งคุรุเทพ)
-- Drop old CHECK constraint + add new one with GURU included
-- Run ใน Supabase SQL Editor: Dashboard → SQL Editor → New query → paste this → Run

-- ==== contents.course ====
alter table public.contents
  drop constraint if exists contents_course_check;

alter table public.contents
  add constraint contents_course_check
  check (course in ('PFB', 'PHE', 'GURU'));

-- ==== leads.course ====
alter table public.leads
  drop constraint if exists leads_course_check;

alter table public.leads
  add constraint leads_course_check
  check (course in ('PFB', 'PHE', 'GURU'));

-- เช็คผลลัพธ์
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.contents'::regclass, 'public.leads'::regclass)
  and conname like '%_course_check';


-- ===================================================================
-- migration-005-series-images.sql
-- ===================================================================
-- Migration 005: เพิ่ม column series_images_b64 สำหรับเก็บรูปทั้ง carousel ใน row เดียว
-- รันใน Supabase SQL Editor: Dashboard → SQL Editor → paste → Run

alter table public.contents
  add column if not exists series_images_b64 text; -- JSON array ของ base64 strings

-- เช็คผลลัพธ์
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents' and column_name = 'series_images_b64';


-- ===================================================================
-- migration-006-image-jobs.sql
-- ===================================================================
-- Migration 006: image_jobs queue table — สำหรับ async image generation
-- ใช้กับ Supabase Edge Function "image-worker" (มี 150s timeout — แก้ Vercel 60s limit)
-- รันใน Supabase SQL Editor

create table if not exists public.image_jobs (
  id            bigserial primary key,
  prompt        text not null,
  model         text default 'openai/gpt-5.4-image-2',
  status        text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  image_base64  text,
  image_url     text,
  error         text,
  provider      text,
  cost_estimate_usd numeric(8,4),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists image_jobs_status_idx on public.image_jobs(status);
create index if not exists image_jobs_created_idx on public.image_jobs(created_at desc);

-- ลบ jobs เก่ากว่า 7 วัน อัตโนมัติ (cleanup)
create or replace function public.cleanup_old_image_jobs() returns void as $$
begin
  delete from public.image_jobs where created_at < now() - interval '7 days';
end;
$$ language plpgsql;

-- ตรวจผล
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'image_jobs'
order by ordinal_position;


-- ===================================================================
-- migration-007-stuck-jobs-watchdog.sql
-- ===================================================================
-- Migration 007: watchdog ฟังก์ชัน + scheduled job — ปิด jobs ที่ค้าง processing
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ปัญหา: ถ้า Edge Function wall-clock timeout (150s free tier / 400s pro)
-- row จะค้าง status='processing' ตลอดไป เพราะ function ตายก่อน update DB
--
-- แก้: SQL function ตัด timeout เป็น 'failed' ทุก 5 นาที (cron)

create or replace function public.mark_stale_image_jobs_as_failed()
returns int as $$
declare
  affected int;
begin
  update public.image_jobs
    set status = 'failed',
        error = 'Edge Function wall-clock timeout — worker killed before completion',
        updated_at = now()
    where status = 'processing'
      and created_at < now() - interval '3 minutes';
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql;

-- รันทันทีล้าง row ที่ค้างอยู่
select public.mark_stale_image_jobs_as_failed() as marked_failed;

-- เปิด pg_cron extension (ถ้ายังไม่ได้เปิด — Dashboard → Database → Extensions → pg_cron)
-- แล้ว schedule cron ทุก 5 นาที:
--
-- select cron.schedule(
--   'cleanup-stuck-image-jobs',
--   '*/5 * * * *',
--   $$ select public.mark_stale_image_jobs_as_failed() $$
-- );
--
-- หรือเรียกผ่าน Supabase Scheduled Triggers ใน Dashboard → Database → Cron Jobs

-- ตรวจผล
select status, count(*) from public.image_jobs group by status order by count desc;


-- ===================================================================
-- migration-009-team-workspace.sql
-- ===================================================================
-- Migration 009: team_workspace — single-row JSONB ที่ทุก browser อ่าน/เขียนเหมือนกัน
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ทำให้ admin UI เป็น shared workspace แทนการมี state ส่วนตัวต่อ browser:
-- - User A กด Generate All → state ถูก write ลง DB
-- - User B (เปิดอยู่อีก browser) → polling ทุก 3s เห็น state ใหม่ → render เหมือน A เห็น
-- - Form inputs / generated caption / image / hashtags / imageHistory — share หมด
--
-- Conflict policy: last writer wins (เหมาะกับทีมเล็ก, ไม่ต้อง CRDT)

create table if not exists public.team_workspace (
  id          int primary key,                       -- always 1 (single row)
  state       jsonb not null default '{}'::jsonb,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  version     bigserial                              -- เพิ่มทุกครั้งที่ update — frontend ใช้ detect newer
);

-- Bootstrap singleton row
insert into public.team_workspace (id, state)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ตรวจผล
select id, version, updated_by, updated_at, jsonb_pretty(state) as state
from public.team_workspace
where id = 1;


-- ===================================================================
-- migration-010-series-group-id.sql
-- ===================================================================
-- Migration 010: series_group_id — ผูก scheduled series หลายแถวเป็น 1 carousel
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ปัญหา: saveSeriesAsScheduled สร้าง 3 row แยกกัน → cron post 3 รูปแยกกัน
--        แต่ user คาดหวัง 1 carousel post ที่มี 3 รูป
--
-- แก้: ทุก slide ของ series เดียวกันได้ series_group_id ตัวเดียว → cron group แล้วยิง
--      /api/facebook/post-carousel + /api/instagram/post-carousel แทนการ post ทีละแถว

alter table public.contents
  add column if not exists series_group_id uuid;

create index if not exists contents_series_group_idx
  on public.contents(series_group_id)
  where series_group_id is not null;

-- ตรวจผล
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents' and column_name = 'series_group_id';


-- ===================================================================
-- migration-011-team-workspace-realtime.sql
-- ===================================================================
-- Migration 011: เปิด Realtime + RLS สำหรับ team_workspace
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ทำให้ทุก browser ที่ login admin subscribe การเปลี่ยน team_workspace ผ่าน WebSocket
-- (เห็นการเปลี่ยนแปลงเป็น real-time เหมือน Google Docs — ไม่ต้องรอ polling 3s)

-- 1. เปิด Realtime publication ให้ table นี้
alter publication supabase_realtime add table public.team_workspace;

-- 2. เปิด RLS — บังคับให้ทุก client ต้องผ่าน policy
alter table public.team_workspace enable row level security;

-- 3. Policy: anon role อ่าน + เขียนได้ (แอป gate ด้วย JWT ตัวเองอยู่แล้ว — anon key
--    ออกแค่ user ที่ login passed requireAuth → frontend ใช้ anon key subscribe)
--    Writes ยังไปผ่าน Vercel API ด้วย service_role อยู่
drop policy if exists "team_workspace_anon_read" on public.team_workspace;
create policy "team_workspace_anon_read"
  on public.team_workspace
  for select
  to anon, authenticated
  using (true);

-- ตรวจผล
select pubname, schemaname, tablename
from pg_publication_tables
where tablename = 'team_workspace';

select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'team_workspace';


-- ===================================================================
-- migration-012-content-image-prompt.sql
-- ===================================================================
-- Migration 012: เพิ่ม image_prompt + image_job_id ใน contents
-- ทำให้ draft บันทึก "prompt ที่ใช้ gen" + "อ้างอิง image_jobs" → reopen แล้ว resume ต่อได้

alter table public.contents
  add column if not exists image_prompt text,
  add column if not exists image_job_id bigint;

-- ตรวจ
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents'
  and column_name in ('image_prompt', 'image_job_id');


-- ===================================================================
-- migration-013-content-series-meta.sql
-- ===================================================================
-- Migration 013: เพิ่ม series_meta JSONB ใน contents
-- เก็บ metadata ของ slides ทั้งหมด (title, subtitle, content, image_prompt)
-- เพื่อให้ reopen draft series → restore ทั้ง text + prompt ครบ ไม่ใช่แค่รูป

alter table public.contents
  add column if not exists series_meta jsonb;

-- ตรวจ
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents'
  and column_name = 'series_meta';


-- ===================================================================
-- migration-014-content-processing-status.sql
-- ===================================================================
-- Migration 014: เพิ่ม 'processing' ใน contents.status check constraint
-- ใช้ตอน cron lock row ด้วยการ update status → 'processing' (atomic race guard)
--
-- ⚠️ ถ้า constraint ไม่ accept 'processing' จะ error ตอน cron พยายาม claim row

-- ลบ constraint เก่า
alter table public.contents drop constraint if exists contents_status_check;

-- สร้างใหม่ + เพิ่ม processing
alter table public.contents add constraint contents_status_check
  check (status in ('draft', 'scheduled', 'processing', 'published', 'failed'));

-- ตรวจ
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.contents'::regclass and contype = 'c';


-- ===================================================================
-- migration-015-lipsync-clip-jobs.sql
-- ===================================================================
-- Migration 015: lipsync_clip_jobs queue — async lip-sync video generation (fal.ai)
-- ใช้ตอน gen Reel ที่มี mascot พูดได้ — ส่งรูป mascot + audio chunk ให้ fal.ai SadTalker
-- รันใน Supabase SQL Editor

create table if not exists public.lipsync_clip_jobs (
  id              bigserial primary key,
  -- scope (เผื่อ join ทีหลัง — Reel 1 ตัวมีหลาย clip)
  reel_session_id text,                          -- group ตาม Reel session (uuid frontend)
  scene_idx       int,                           -- ลำดับ scene ใน Reel (0=hook, 1+=body, n=cta)
  -- inputs
  image_url       text not null,                 -- mascot face image (public URL หรือ data URL)
  audio_url       text not null,                 -- audio chunk for this scene (public URL)
  model           text default 'fal-ai/sadtalker',
  duration_sec    int,                           -- expected duration (เผื่อ validate)
  -- output
  video_url       text,                          -- fal.ai result URL (MP4)
  status          text not null default 'pending'
                  check (status in ('pending', 'processing', 'done', 'failed')),
  error           text,
  provider        text,                          -- 'fal-ai-sync-render' เผื่อ track
  cost_estimate_usd numeric(8,4),
  -- timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists lipsync_clip_jobs_status_idx on public.lipsync_clip_jobs(status);
create index if not exists lipsync_clip_jobs_created_idx on public.lipsync_clip_jobs(created_at desc);
create index if not exists lipsync_clip_jobs_session_idx on public.lipsync_clip_jobs(reel_session_id, scene_idx);

-- RLS — service-role only (เหมือน image_jobs)
alter table public.lipsync_clip_jobs enable row level security;
-- ไม่ต้องสร้าง policy — service-role bypass RLS อยู่แล้ว anon ไม่ต้องเข้าถึง

-- ลบ jobs เก่ากว่า 7 วัน อัตโนมัติ (cleanup ตามแพทเทิร์น image_jobs)
create or replace function public.cleanup_old_lipsync_clip_jobs() returns void as $$
begin
  delete from public.lipsync_clip_jobs where created_at < now() - interval '7 days';
end;
$$ language plpgsql;

-- ตรวจผล
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'lipsync_clip_jobs'
order by ordinal_position;


-- ===================================================================
-- migration-016-multitenant.sql
-- ===================================================================
-- Migration 016: Multi-tenant SaaS — แยกข้อมูลต่อบัญชี (tenant)
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- เปลี่ยน OEM Content Factory จาก single-tenant → multi-tenant SaaS:
-- - ทุก business สมัครเอง → ได้ tenant (workspace) ของตัวเอง
-- - ข้อมูลทุกตาราง (contents, settings, brand voice, FB/TT creds, workspace)
--   ถูก scope ด้วย tenant_id — บัญชีอื่นมองไม่เห็นข้อมูลกัน
-- - ข้อมูลเดิมทั้งหมด backfill เป็น tenant_id = 1 (Default Workspace)
--
-- ⚠️  รันครั้งเดียว — idempotent (ใช้ if not exists / do-block guards)

-- =========== tenants ===========
create table if not exists public.tenants (
  id          bigserial primary key,
  name        text not null,
  slug        text unique,
  plan        text default 'free',
  created_at  timestamptz not null default now()
);

-- Bootstrap: tenant #1 = เจ้าของเดิม (ข้อมูลทั้งหมดที่มีอยู่)
insert into public.tenants (id, name, slug, plan)
values (1, 'Default Workspace', 'default', 'owner')
on conflict (id) do nothing;
-- ดัน sequence ให้ข้าม id ที่ insert มือ
select setval(pg_get_serial_sequence('public.tenants','id'),
              greatest((select max(id) from public.tenants), 1));

-- =========== users ===========
-- email ไม่ซ้ำทั้งระบบ (1 อีเมล = 1 บัญชี = 1 tenant ในเฟสนี้)
create table if not exists public.users (
  id            bigserial primary key,
  tenant_id     bigint not null references public.tenants(id) on delete cascade,
  email         text unique not null,
  password_hash text not null,
  name          text,
  role          text default 'owner',          -- owner | editor | viewer
  created_at    timestamptz not null default now()
);
create index if not exists users_tenant_idx on public.users(tenant_id);

-- ย้าย admin_users เดิม (ถ้ามี) → users ภายใต้ tenant 1
insert into public.users (tenant_id, email, password_hash, role)
select 1, email, password_hash, coalesce(role, 'owner')
from public.admin_users
on conflict (email) do nothing;

-- =========== add tenant_id ให้ตารางข้อมูล ===========
alter table public.contents         add column if not exists tenant_id bigint not null default 1;
alter table public.automation_logs  add column if not exists tenant_id bigint not null default 1;
alter table public.leads            add column if not exists tenant_id bigint not null default 1;

-- image_jobs / lipsync_clip_jobs อาจยังไม่มี (migration 006/015) — guard ด้วย to_regclass
do $$ begin
  if to_regclass('public.image_jobs') is not null then
    alter table public.image_jobs add column if not exists tenant_id bigint not null default 1;
  end if;
  if to_regclass('public.lipsync_clip_jobs') is not null then
    alter table public.lipsync_clip_jobs add column if not exists tenant_id bigint not null default 1;
  end if;
end $$;

create index if not exists contents_tenant_idx        on public.contents(tenant_id);
create index if not exists automation_logs_tenant_idx on public.automation_logs(tenant_id);

-- FK constraints (เพิ่มแบบ guarded — ถ้ามีแล้วข้าม)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contents_tenant_fk') then
    alter table public.contents add constraint contents_tenant_fk
      foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;

-- =========== ปลด CHECK 'course' (PFB/PHE/GURU) — tenant ใหม่ใช้ชื่อ brand เองได้ ===========
do $$
declare cn text;
begin
  for cn in
    select conname from pg_constraint
    where conrelid = 'public.contents'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%course%'
  loop execute format('alter table public.contents drop constraint %I', cn); end loop;
  for cn in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%course%'
  loop execute format('alter table public.leads drop constraint %I', cn); end loop;
end $$;

-- =========== settings → PK (tenant_id, key) ===========
alter table public.settings add column if not exists tenant_id bigint not null default 1;
do $$ begin
  if exists (select 1 from pg_constraint
             where conrelid = 'public.settings'::regclass and contype = 'p') then
    alter table public.settings drop constraint settings_pkey;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.settings'::regclass and contype = 'p') then
    alter table public.settings add primary key (tenant_id, key);
  end if;
end $$;

-- =========== team_workspace → 1 row ต่อ tenant ===========
alter table public.team_workspace add column if not exists tenant_id bigint;
update public.team_workspace set tenant_id = 1 where tenant_id is null;
alter table public.team_workspace alter column tenant_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'team_workspace_tenant_uk') then
    alter table public.team_workspace add constraint team_workspace_tenant_uk unique (tenant_id);
  end if;
end $$;

-- =========== RLS (backend ใช้ service_role → bypass อยู่แล้ว) ===========
alter table public.tenants enable row level security;
alter table public.users   enable row level security;

-- ตรวจผล
select 'tenants' t, count(*) from public.tenants
union all select 'users', count(*) from public.users
union all select 'contents w/ tenant', count(*) from public.contents where tenant_id is not null;


