-- Migration 005: เพิ่ม column series_images_b64 สำหรับเก็บรูปทั้ง carousel ใน row เดียว
-- รันใน Supabase SQL Editor: Dashboard → SQL Editor → paste → Run

alter table public.contents
  add column if not exists series_images_b64 text; -- JSON array ของ base64 strings

-- เช็คผลลัพธ์
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents' and column_name = 'series_images_b64';
