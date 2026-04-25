alter table public.deals add column if not exists contract_at timestamptz;
alter table public.deals add column if not exists disclosures_ack jsonb;
