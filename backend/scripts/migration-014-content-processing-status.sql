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
