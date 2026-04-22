-- P1 · 0001_init.sql
-- Multi-tenant core schema for Wholesail. Every row that a user can
-- read carries a firm_id; RLS (0002) enforces tenant isolation.

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Firms = tenants. One firm per paying account.
create table public.firms (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  plan                    text not null default 'trialing'
                          check (plan in ('trialing','scout','operator','firm','canceled')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  trial_ends_at           timestamptz,
  state_scope             text[] not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Users mirror auth.users. display_name stays in public.users so the
-- app never touches auth.users directly.
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  created_at    timestamptz not null default now()
);

create table public.memberships (
  firm_id     uuid not null references public.firms(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null default 'member'
              check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  primary key (firm_id, user_id)
);

create index memberships_user_idx on public.memberships(user_id);

-- Deals = working unit. draft/analysis/ai_narrative mirror existing
-- client types; tighten to columns in later phases.
create table public.deals (
  id             uuid primary key default uuid_generate_v4(),
  firm_id        uuid not null references public.firms(id) on delete cascade,
  state          text,
  status         text not null default 'draft',
  draft          jsonb not null default '{}'::jsonb,
  analysis       jsonb,
  ai_narrative   jsonb,
  snapshot_hash  text,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index deals_firm_updated_idx
  on public.deals(firm_id, updated_at desc);

create table public.docs (
  id          uuid primary key default uuid_generate_v4(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  firm_id     uuid not null references public.firms(id) on delete cascade,
  kind        text not null,
  body        text not null,
  source      text not null default 'deterministic'
              check (source in ('deterministic','ai')),
  input_hash  text,
  pdf_url     text,
  created_at  timestamptz not null default now()
);

create index docs_deal_idx on public.docs(deal_id);

create table public.ai_runs (
  id             uuid primary key default uuid_generate_v4(),
  firm_id        uuid not null references public.firms(id) on delete cascade,
  deal_id        uuid references public.deals(id) on delete set null,
  kind           text not null,
  input_hash     text,
  prompt_tokens  int,
  output_tokens  int,
  cost_cents     int,
  created_at     timestamptz not null default now()
);

create index ai_runs_firm_created_idx
  on public.ai_runs(firm_id, created_at desc);

create table public.kb_chunks (
  id           uuid primary key default uuid_generate_v4(),
  state        text not null,
  section      text,
  content      text not null,
  embedding    vector(1024),
  source_url   text,
  verified_at  timestamptz not null default now()
);

create index kb_chunks_state_idx on public.kb_chunks(state);
create index kb_chunks_embedding_idx on public.kb_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Waitlist is public-append-only. RLS insert allowed for anon; select
-- denied by default (no select policy).
create table public.waitlist (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  state         text,
  submitted_at  timestamptz not null default now()
);

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger firms_set_updated_at
  before update on public.firms
  for each row execute function public.set_updated_at();

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- When a user signs up via Supabase auth, mirror them into public.users.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
