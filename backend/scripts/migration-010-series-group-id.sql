-- Migration 010: series_group_id — ผูก scheduled series หลายแถวเป็น 1 carousel
-- รันใน Supabase SQL Editor (project: lipebqblrqbmvwmmttua)
--
-- ปัญหา: saveSeriesAsScheduled สร้าง 3 row แยกกัน → cron post 3 รูปแยกกัน
--        แต่ user คาดหวัง 1 carousel post ที่มี 3 รูป
--
-- แก้: ทุก slide ของ series เดียวกันได้ series_group_id ตัวเดียว → cron group แล้วยิง
--      /api/facebook/post-carousel + /api/instagram/post-carousel แทนการ post ทีละแถว

alter table public.contents
  add column if not exists series_group_id uuid;

create index if not exists contents_series_group_idx
  on public.contents(series_group_id)
  where series_group_id is not null;

-- ตรวจผล
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'contents' and column_name = 'series_group_id';
