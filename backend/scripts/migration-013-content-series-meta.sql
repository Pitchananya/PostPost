-- Migration 013: เพิ่ม series_meta JSONB ใน contents
-- เก็บ metadata ของ slides ทั้งหมด (title, subtitle, content, image_prompt)
-- เพื่อให้ reopen draft series → restore ทั้ง text + prompt ครบ ไม่ใช่แค่รูป

alter table public.contents
  add column if not exists series_meta jsonb;

-- ตรวจ
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents'
  and column_name = 'series_meta';
