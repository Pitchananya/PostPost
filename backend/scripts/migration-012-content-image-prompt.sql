-- Migration 012: เพิ่ม image_prompt + image_job_id ใน contents
-- ทำให้ draft บันทึก "prompt ที่ใช้ gen" + "อ้างอิง image_jobs" → reopen แล้ว resume ต่อได้

alter table public.contents
  add column if not exists image_prompt text,
  add column if not exists image_job_id bigint;

-- ตรวจ
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents'
  and column_name in ('image_prompt', 'image_job_id');
