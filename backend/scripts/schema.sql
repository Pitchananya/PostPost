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
