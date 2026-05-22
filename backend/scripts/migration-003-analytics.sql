-- Migration 003: เพิ่ม fields สำหรับ analytics caching
-- รันใน Supabase SQL Editor — ปลอดภัย rerun ได้

-- cached metrics จาก FB/IG insights (เก็บไว้ไม่ต้อง fetch ทุกครั้ง)
alter table public.contents add column if not exists cached_metrics jsonb default '{}';
alter table public.contents add column if not exists metrics_fetched_at timestamptz;

-- index สำหรับ analytics queries
create index if not exists contents_published_at_idx on public.contents(published_at desc)
  where status = 'published';

create index if not exists leads_created_at_idx on public.leads(created_at desc);

do $$ begin
  raise notice 'Migration 003 applied — analytics caching ready';
end $$;
