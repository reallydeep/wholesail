-- P1 · 0002_rls.sql
-- Row-Level Security. Every table with firm_id locks reads/writes to
-- members of that firm. Users see only their own users row.

alter table public.firms         enable row level security;
alter table public.users         enable row level security;
alter table public.memberships   enable row level security;
alter table public.deals         enable row level security;
alter table public.docs          enable row level security;
alter table public.ai_runs       enable row level security;
alter table public.kb_chunks     enable row level security;
alter table public.waitlist      enable row level security;

-- Helper: is the current auth.uid() a member of the given firm?
create or replace function public.is_member_of(fid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.memberships
    where firm_id = fid and user_id = auth.uid()
  );
$$;

-- firms: members read; owner/admin update; inserts via service role.
create policy firms_select on public.firms
  for select using (public.is_member_of(id));

create policy firms_update on public.firms
  for update using (
    exists (
      select 1 from public.memberships
      where firm_id = firms.id
        and user_id = auth.uid()
        and role in ('owner','admin')
    )
  );

-- users: self-read + self-update.
create policy users_select_self on public.users
  for select using (id = auth.uid());

create policy users_update_self on public.users
  for update using (id = auth.uid());

-- memberships: see own rows + other members of firms you belong to.
create policy memberships_select on public.memberships
  for select using (
    user_id = auth.uid() or public.is_member_of(firm_id)
  );

-- deals: CRUD for firm members.
create policy deals_rw on public.deals
  for all
  using (public.is_member_of(firm_id))
  with check (public.is_member_of(firm_id));

-- docs: CRUD for firm members.
create policy docs_rw on public.docs
  for all
  using (public.is_member_of(firm_id))
  with check (public.is_member_of(firm_id));

-- ai_runs: read + insert for firm members.
create policy ai_runs_select on public.ai_runs
  for select using (public.is_member_of(firm_id));
create policy ai_runs_insert on public.ai_runs
  for insert with check (public.is_member_of(firm_id));

-- kb_chunks: readable by authenticated users; writes via service role.
create policy kb_chunks_read on public.kb_chunks
  for select using (auth.uid() is not null);

-- waitlist: anon + authenticated INSERT allowed. No select policy →
-- select denied except to service role.
create policy waitlist_insert_anon on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
