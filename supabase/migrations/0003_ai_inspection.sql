alter table public.deals add column if not exists ai_inspection jsonb;
alter table public.deals add column if not exists ai_inspection_hash text;
alter table public.deals add column if not exists ai_inspection_at timestamptz;
create index if not exists deals_ai_inspection_hash_idx on public.deals (ai_inspection_hash);
