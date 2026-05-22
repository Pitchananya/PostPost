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
