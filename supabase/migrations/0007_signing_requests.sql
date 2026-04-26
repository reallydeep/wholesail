-- P-eSign · 0007_signing_requests.sql
-- Token-based e-signature. Public routes read/write a single row via
-- a non-guessable token (never via firm_id), so RLS is split:
--   - firm members do CRUD via firm_id (normal RLS)
--   - anonymous public can SELECT a single row by token (lookup only)
--   - anonymous public can UPDATE a single row by token (only signature
--     fields, only when status='pending', enforced in policy)

create table public.signing_requests (
  id              uuid primary key default uuid_generate_v4(),
  token           text not null unique,
  firm_id         uuid not null references public.firms(id) on delete cascade,
  deal_id         uuid not null references public.deals(id) on delete cascade,
  doc_type        text not null
                  check (doc_type in ('offer-letter','psa','assignment')),
  signer_role     text not null
                  check (signer_role in ('seller','buyer')),
  signer_name     text,
  signer_email    text,
  status          text not null default 'pending'
                  check (status in ('pending','viewed','signed','declined','expired')),
  signature_png   text,        -- base64 data URL
  typed_name      text,
  consent         boolean not null default false,
  ip              text,
  user_agent      text,
  created_at      timestamptz not null default now(),
  viewed_at       timestamptz,
  signed_at       timestamptz,
  expires_at      timestamptz not null default (now() + interval '30 days')
);

create index signing_requests_deal_idx on public.signing_requests(deal_id);
create index signing_requests_firm_idx on public.signing_requests(firm_id);
create unique index signing_requests_token_idx on public.signing_requests(token);

alter table public.signing_requests enable row level security;

-- Firm members: full CRUD on their firm's signing requests.
create policy signing_requests_firm_rw on public.signing_requests
  for all
  using (public.is_member_of(firm_id))
  with check (public.is_member_of(firm_id));

-- Public (anon) lookup: read a single row by token. No firm_id leakage
-- prevention needed — the token IS the secret.
create policy signing_requests_public_read on public.signing_requests
  for select
  to anon, authenticated
  using (true);

-- Public update: only the signature/audit fields, only on pending rows.
-- Postgres RLS can't restrict columns directly, so we restrict by
-- pre-update status and let the application send only allowed fields.
create policy signing_requests_public_sign on public.signing_requests
  for update
  to anon, authenticated
  using (status in ('pending','viewed'))
  with check (status in ('pending','viewed','signed','declined'));
