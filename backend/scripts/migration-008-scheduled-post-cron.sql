-- Migration 008: Supabase pg_cron → POST /api/cron/run-scheduled ทุกนาที
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ปัญหา: Vercel Hobby free tier จำกัด cron ได้แค่วันละ 1 ครั้ง
-- → scheduled posts ที่ตั้งเวลาอื่น (เช่น 14:00) จะพลาด
--
-- แก้: ใช้ Supabase pg_cron + pg_net ping Vercel endpoint ทุกนาที (ฟรี)

-- ⚠️ STEP 1 (ทำใน Dashboard ก่อน — ไม่ผ่าน SQL):
-- ไป https://supabase.com/dashboard/project/lipebqblrqbmvwmmttua/database/extensions
-- → search "pg_cron" → toggle Enable
-- → search "pg_net"  → toggle Enable
-- (Supabase ไม่ให้ enable ผ่าน SQL ปกติ ต้องใช้ Dashboard)

-- Verify extensions ก่อนทำต่อ (จะ raise error ถ้ายังไม่ enable)
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'pg_cron extension not enabled — go to Dashboard → Database → Extensions → enable pg_cron first';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'pg_net extension not enabled — go to Dashboard → Database → Extensions → enable pg_net first';
  end if;
end $$;

-- STEP 2: สร้าง wrapper function ที่เรียก Vercel
create or replace function public.ping_vercel_cron()
returns void as $$
declare
  vercel_url text := 'https://oem-content-factory.vercel.app/api/cron/run-scheduled';
  cron_secret text := '42463254967480fe1aedd66b2236341c3cbf8fbf3386d5c88785f3cdbb2a4b45';
begin
  perform net.http_post(
    url := vercel_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$ language plpgsql;

-- STEP 3: ลบ schedule เก่าถ้ามี (idempotent)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'vercel-run-scheduled-posts') then
    perform cron.unschedule('vercel-run-scheduled-posts');
  end if;
end $$;

-- STEP 4: ตั้ง schedule ทุกนาที
select cron.schedule(
  'vercel-run-scheduled-posts',     -- job name
  '* * * * *',                       -- ทุกนาที
  'select public.ping_vercel_cron();'
);

-- STEP 5: ตรวจว่า scheduled
select jobid, schedule, command, jobname, active
from cron.job
where jobname = 'vercel-run-scheduled-posts';

-- STEP 6: หลังรันสัก 2-3 นาที — ตรวจ log ว่ายิงผ่าน
-- select * from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'vercel-run-scheduled-posts')
-- order by start_time desc limit 10;
--
-- column `status` ต้องเป็น 'succeeded'
-- ถ้า 'failed' → ดู `return_message`

-- 🛑 ปิด cron ภายหลัง (ถ้าจะหยุด):
-- select cron.unschedule('vercel-run-scheduled-posts');
