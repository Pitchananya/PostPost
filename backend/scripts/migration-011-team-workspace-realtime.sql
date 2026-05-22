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
