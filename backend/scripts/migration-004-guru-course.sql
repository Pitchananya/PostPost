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
