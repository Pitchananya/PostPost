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
