-- Migration 006: image_jobs queue table — สำหรับ async image generation
-- ใช้กับ Supabase Edge Function "image-worker" (มี 150s timeout — แก้ Vercel 60s limit)
-- รันใน Supabase SQL Editor

create table if not exists public.image_jobs (
  id            bigserial primary key,
  prompt        text not null,
  model         text default 'openai/gpt-5.4-image-2',
  status        text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  image_base64  text,
  image_url     text,
  error         text,
  provider      text,
  cost_estimate_usd numeric(8,4),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists image_jobs_status_idx on public.image_jobs(status);
create index if not exists image_jobs_created_idx on public.image_jobs(created_at desc);

-- ลบ jobs เก่ากว่า 7 วัน อัตโนมัติ (cleanup)
create or replace function public.cleanup_old_image_jobs() returns void as $$
begin
  delete from public.image_jobs where created_at < now() - interval '7 days';
end;
$$ language plpgsql;

-- ตรวจผล
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'image_jobs'
order by ordinal_position;
