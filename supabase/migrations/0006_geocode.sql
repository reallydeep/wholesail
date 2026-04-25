alter table public.deals add column if not exists lat double precision;
alter table public.deals add column if not exists lon double precision;
alter table public.deals add column if not exists geocoded_at timestamptz;
