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
