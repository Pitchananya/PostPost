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
