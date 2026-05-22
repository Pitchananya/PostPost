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
