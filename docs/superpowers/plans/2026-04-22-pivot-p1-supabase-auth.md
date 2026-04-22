# P1 — Supabase + Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage prototype auth with a real multi-tenant foundation: Supabase Postgres + Auth + RLS, firms and memberships, a 14-state gate on signup, and data migration off localStorage. After this plan, new users sign up into a firm with a role; the app reads Postgres through RLS; no feature still depends on localStorage for source-of-truth state.

**Architecture:** Supabase (Postgres + Auth + RLS) is the single tenant boundary — every deal/doc/AI run row carries `firm_id` and RLS enforces `firm_id ∈ my_memberships`. Next.js App Router uses `@supabase/ssr` for cookie-based sessions across server components, route handlers, and middleware. Client keeps a thin `useSession` hook backed by the same cookie.

**Tech Stack:** Next.js 16.2.4 (App Router, Turbopack), React 19.2, TypeScript 5, Supabase JS v2, `@supabase/ssr`, Tailwind v4.

---

## Files

### Create
- `supabase/config.toml` — local Supabase project config
- `supabase/migrations/0001_init.sql` — tables + indexes
- `supabase/migrations/0002_rls.sql` — row-level security policies
- `supabase/migrations/0003_seed_states.sql` — optional seed rows for reference tables
- `supabase/tests/rls.sql` — pgTap-ish RLS assertions (runs via `supabase test db`)
- `src/lib/env.ts` — typed `process.env` reader
- `src/lib/supabase/browser.ts` — browser client
- `src/lib/supabase/server.ts` — server client (reads cookies)
- `src/lib/supabase/admin.ts` — service-role client (server-only)
- `src/lib/supabase/types.ts` — DB type aliases hand-written (switch to `supabase gen types` later)
- `src/lib/auth/supabase-session.ts` — `getServerSession`, `requireServerSession`, client `useSession`
- `src/lib/firms/queries.ts` — `getMyFirm`, `getMyMembership`, `createFirmForOwner`
- `src/lib/deals/supabase-store.ts` — replaces `src/lib/deals/store.ts` internals
- `src/lib/waitlist/queries.ts` — `addWaitlistEntry`
- `src/middleware.ts` — route protection + session refresh
- `src/app/(auth)/signup/_components/state-picker.tsx` — 14-state multi-select + red-state fallback
- `src/app/waitlist/page.tsx` — red-state capture page
- `src/app/api/signup/route.ts` — POST: validate states → create user → create firm → create membership → redirect to Stripe (Stripe wiring comes in P2; for now redirect to `/app`)

### Modify
- `package.json` — add `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- `.env.local.example` (create if missing) — Supabase keys
- `src/lib/compliance/index.ts` — expand `SUPPORTED_STATES` from 3 to 14
- `src/lib/compliance/types.ts` — expand `StateCode` union
- `src/lib/address/parse.ts` — uses new `StateCode` (no code change; verify type compiles)
- `src/app/(auth)/signup/page.tsx` — replace localStorage flow with Supabase + state picker
- `src/app/(auth)/signin/page.tsx` — replace localStorage flow with Supabase
- `src/app/(auth)/layout.tsx` — no-op, just confirm still works
- `src/app/app/layout.tsx` — read session from Supabase server client; redirect if absent
- `src/app/app/_components/app-header.tsx` — swap `useSession` import to new module, show firm name
- `src/lib/deals/store.ts` — becomes a thin wrapper that calls `supabase-store.ts` (keeps existing callsites working); localStorage path removed except for one-time migration
- `src/lib/auth/session.ts` — deprecate (kept only for migration helper that reads old localStorage on first signin)

### Delete (after migration proves out in W2)
- nothing yet — deprecate then delete in P2

---

## Task 1: Install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install runtime deps**

Run from `/Users/deeppatel/Desktop/wholesail`:
```bash
npm i @supabase/supabase-js @supabase/ssr zod
```
Expected: additions in `package.json` dependencies. No errors.

- [ ] **Step 2: Install Supabase CLI (dev-only)**

Run:
```bash
npm i -D supabase
```
Or if already installed globally via Homebrew (`supabase --version`), skip. Project assumes local CLI is available as `npx supabase` OR `supabase`.

- [ ] **Step 3: Verify versions**

Run:
```bash
npm ls @supabase/supabase-js @supabase/ssr zod
```
Expected: prints resolved versions, no "UNMET DEPENDENCY."

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase + zod deps for multi-tenant pivot"
```

---

## Task 2: Environment scaffolding

**Files:**
- Create: `src/lib/env.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (confirm `.env.local` ignored)

- [ ] **Step 1: Write `.env.local.example`**

Create `/Users/deeppatel/Desktop/wholesail/.env.local.example`:
```bash
# Supabase — create project at supabase.com/dashboard, copy values from
# Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Anthropic (already required)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-7

# Feature flags (default off)
NEXT_PUBLIC_USE_SUPABASE=false
```

- [ ] **Step 2: Confirm `.gitignore`**

Run:
```bash
grep -E "\.env\.local$|\.env\*\.local" /Users/deeppatel/Desktop/wholesail/.gitignore
```
Expected: at least one match. If empty, append `.env*.local` to `.gitignore`.

- [ ] **Step 3: Write `src/lib/env.ts`**

Create file:
```ts
// Central env reader. Throws at module load if server-only vars are
// missing when code runs on the server. Public vars return undefined
// rather than throwing so client bundles stay clean.
import { z } from "zod";

const ServerSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-4-7"),
});

const PublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_USE_SUPABASE: z
    .enum(["true", "false"])
    .default("false"),
});

export const publicEnv = PublicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_USE_SUPABASE:
    process.env.NEXT_PUBLIC_USE_SUPABASE ?? "false",
});

export function serverEnv() {
  return ServerSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  });
}

export const useSupabase = publicEnv.NEXT_PUBLIC_USE_SUPABASE === "true";
```

- [ ] **Step 4: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: zero errors. If zod types fail, verify `"moduleResolution": "bundler"` in `tsconfig.json`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts .env.local.example
git commit -m "chore: add env schema + supabase env template"
```

---

## Task 3: Initialize Supabase project + migration scaffold

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/` (directory)

- [ ] **Step 1: Initialize Supabase**

Run:
```bash
cd /Users/deeppatel/Desktop/wholesail && npx supabase init
```
Expected: creates `supabase/config.toml`. Accept defaults (project id `wholesail`).

- [ ] **Step 2: Link to remote project (human step)**

The user (Deep) must:
1. Visit `supabase.com/dashboard` → New Project → name `wholesail` → pick a region near Ohio/Texas (us-east-2 recommended) → strong DB password
2. Copy the project ref + URL + anon key + service role key into `.env.local` (based on `.env.local.example`)
3. Run:
```bash
npx supabase link --project-ref <PROJECT_REF>
```

- [ ] **Step 3: Verify local Supabase up (optional, for local dev)**

Run:
```bash
npx supabase start
```
Expected: spins up local Postgres. If Docker not installed, skip — we can develop against the remote project directly.

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml
git commit -m "chore: supabase project init"
```

---

## Task 4: Schema migration (tables + indexes)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/0001_init.sql`:
```sql
-- P1 · 0001_init.sql
-- Multi-tenant core schema for Wholesail. Every row that a user can
-- read carries a firm_id; RLS (0002) enforces tenant isolation.

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Firms = tenants. One firm per paying account.
create table public.firms (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  plan              text not null default 'trialing'
                    check (plan in ('trialing','scout','operator','firm','canceled')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  trial_ends_at     timestamptz,
  state_scope       text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Users mirror auth.users (Supabase-managed). We keep display_name here
-- so we never touch auth.users directly from the app.
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  created_at    timestamptz not null default now()
);

create table public.memberships (
  firm_id   uuid not null references public.firms(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'member'
            check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (firm_id, user_id)
);

create index memberships_user_idx on public.memberships(user_id);

-- Deals = the working unit. draft/analysis/ai_narrative are jsonb
-- blobs matching existing client types; we'll tighten to columns later.
create table public.deals (
  id            uuid primary key default uuid_generate_v4(),
  firm_id       uuid not null references public.firms(id) on delete cascade,
  state         text,
  status        text not null default 'draft',
  draft         jsonb not null default '{}'::jsonb,
  analysis      jsonb,
  ai_narrative  jsonb,
  snapshot_hash text,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
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

-- Waitlist is public-append-only. No RLS will be enabled on it (insert
-- is allowed for anon, select is denied).
create table public.waitlist (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  state         text,
  submitted_at  timestamptz not null default now()
);

-- updated_at trigger (shared)
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
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Push to Supabase**

Run:
```bash
npx supabase db push
```
Expected: migration applies. Confirm in dashboard: Tables page shows `firms`, `users`, `memberships`, `deals`, `docs`, `ai_runs`, `kb_chunks`, `waitlist`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): initial multi-tenant schema"
```

---

## Task 5: RLS policies

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write RLS migration**

Create `supabase/migrations/0002_rls.sql`:
```sql
-- P1 · 0002_rls.sql
-- Row-Level Security. Every table that carries firm_id locks reads/writes
-- to members of that firm. Users can only see themselves via public.users.

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

-- firms: members can read; owner/admin can update; inserts go through
-- the service role (signup route handler creates the firm).
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

-- users: each user can read their own row. display_name update allowed.
create policy users_select_self on public.users
  for select using (id = auth.uid());

create policy users_update_self on public.users
  for update using (id = auth.uid());

-- memberships: a user sees their own rows + other members of firms they
-- belong to. Modifications go through the service role.
create policy memberships_select on public.memberships
  for select using (
    user_id = auth.uid() or public.is_member_of(firm_id)
  );

-- deals: full CRUD for firm members.
create policy deals_rw on public.deals
  for all
  using (public.is_member_of(firm_id))
  with check (public.is_member_of(firm_id));

-- docs: full CRUD for firm members.
create policy docs_rw on public.docs
  for all
  using (public.is_member_of(firm_id))
  with check (public.is_member_of(firm_id));

-- ai_runs: read/insert for firm members.
create policy ai_runs_select on public.ai_runs
  for select using (public.is_member_of(firm_id));
create policy ai_runs_insert on public.ai_runs
  for insert with check (public.is_member_of(firm_id));

-- kb_chunks: readable by all authenticated users (it's state-law KB,
-- not tenant data). Writes are service-role only (cron seeder).
create policy kb_chunks_read on public.kb_chunks
  for select using (auth.uid() is not null);

-- waitlist: anon INSERT allowed (captures red-state signup attempts);
-- SELECT denied except to service role.
create policy waitlist_insert_anon on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- No select policy → select denied by default for anon/authenticated.
```

- [ ] **Step 2: Push**

```bash
npx supabase db push
```
Expected: migration applies cleanly.

- [ ] **Step 3: Manual RLS smoke test**

In Supabase dashboard SQL editor:
```sql
-- Impersonate a fake user:
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000000"}';
select * from public.deals;
-- Expected: empty (zero rows returned, no error)
reset role;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat(db): RLS policies for tenant isolation"
```

---

## Task 6: Expand `SUPPORTED_STATES` to 14

**Files:**
- Modify: `src/lib/compliance/types.ts`
- Modify: `src/lib/compliance/index.ts`

- [ ] **Step 1: Update `StateCode` union**

Edit `src/lib/compliance/types.ts`. Find the existing `StateCode` type (probably `"OH"|"PA"|"FL"`) and replace with:
```ts
export type StateCode =
  | "AL" | "CO" | "GA" | "KS" | "MI" | "MO" | "NC" | "SC"
  | "TN" | "TX" | "VA" | "WI" | "WV"
  | "OH" | "FL";
```

- [ ] **Step 2: Update `SUPPORTED_STATES`**

Edit `src/lib/compliance/index.ts`:

Replace the existing `SUPPORTED_STATES` export with:
```ts
export const SUPPORTED_STATES: { code: StateCode; name: string; tier: "green" | "yellow" }[] = [
  { code: "AL", name: "Alabama",       tier: "green" },
  { code: "CO", name: "Colorado",      tier: "green" },
  { code: "FL", name: "Florida",       tier: "yellow" },
  { code: "GA", name: "Georgia",       tier: "green" },
  { code: "KS", name: "Kansas",        tier: "green" },
  { code: "MI", name: "Michigan",      tier: "green" },
  { code: "MO", name: "Missouri",      tier: "green" },
  { code: "NC", name: "North Carolina",tier: "green" },
  { code: "OH", name: "Ohio",          tier: "yellow" },
  { code: "SC", name: "South Carolina",tier: "green" },
  { code: "TN", name: "Tennessee",     tier: "green" },
  { code: "TX", name: "Texas",         tier: "green" },
  { code: "VA", name: "Virginia",      tier: "green" },
  { code: "WI", name: "Wisconsin",     tier: "green" },
  { code: "WV", name: "West Virginia", tier: "green" },
];
```

PA is removed. `ALL_RULES` still pulls from `./rules/pa` — drop that import:
```ts
// Replace:
// import { ALL_PA } from "./rules/pa";
// const ALL_RULES: StateRuleSet[] = [...ALL_OH, ...ALL_PA, ...ALL_FL];
// With:
const ALL_RULES: StateRuleSet[] = [...ALL_OH, ...ALL_FL];
```

Delete file `src/lib/compliance/rules/pa.ts` (PA is red-state now, no rule needed):
```bash
rm /Users/deeppatel/Desktop/wholesail/src/lib/compliance/rules/pa.ts
```

- [ ] **Step 3: Add green-state stub rules**

For each green state we need a minimal `StateRuleSet` so `resolveRules` doesn't return undefined mid-flow. Create `src/lib/compliance/rules/green.ts`:
```ts
import type { StateCode, StateRuleSet } from "../types";

const GREEN_STATES: { code: StateCode; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "CO", name: "Colorado" },
  { code: "GA", name: "Georgia" },
  { code: "KS", name: "Kansas" },
  { code: "MI", name: "Michigan" },
  { code: "MO", name: "Missouri" },
  { code: "NC", name: "North Carolina" },
  { code: "SC", name: "South Carolina" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "VA", name: "Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WV", name: "West Virginia" },
];

// Baseline rule set: wholesaling legal, no license required, no mandatory
// disclosure beyond standard contract best-practice.
export const ALL_GREEN: StateRuleSet[] = GREEN_STATES.map(({ code, name }) => ({
  stateCode: code,
  stateName: name,
  effectiveFrom: "2024-01-01",
  assignmentAllowed: true,
  assignmentDisclosureRequired: false,
  sellerConsentRequired: false,
  attorneyAtCloseCustomary: ["AL", "GA", "NC", "SC", "WV", "VA"].includes(code),
  confidence: "high",
}));
```

(If `StateRuleSet` shape differs, align to the existing `src/lib/compliance/types.ts` — the 5 fields above must exist there.)

- [ ] **Step 4: Wire green into index**

Edit `src/lib/compliance/index.ts`:
```ts
import { ALL_OH } from "./rules/oh";
import { ALL_FL } from "./rules/fl";
import { ALL_GREEN } from "./rules/green";
// ...
const ALL_RULES: StateRuleSet[] = [...ALL_GREEN, ...ALL_OH, ...ALL_FL];
```

- [ ] **Step 5: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: zero errors. Any file that pinned `"OH"|"PA"|"FL"` gets flagged — fix by importing `StateCode`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/compliance
git commit -m "feat(compliance): expand to 14-state launch footprint"
```

---

## Task 7: Supabase browser + server clients

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/types.ts`

- [ ] **Step 1: Browser client**

Create `src/lib/supabase/browser.ts`:
```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function supabaseBrowser() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 2: Server client**

Create `src/lib/supabase/server.ts`:
```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — can't mutate cookies here.
            // Middleware is responsible for session refresh, so this is fine.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Service-role admin client**

Create `src/lib/supabase/admin.ts`:
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

// Service-role client bypasses RLS. Only for route handlers that need
// to create firms/memberships during signup, or for cron jobs.
let cached: ReturnType<typeof createClient> | null = null;
export function supabaseAdmin() {
  if (cached) return cached;
  const env = serverEnv();
  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}
```

- [ ] **Step 4: Hand-written types**

Create `src/lib/supabase/types.ts`:
```ts
// Minimal hand-typed rows. Swap for `supabase gen types typescript` later.
import type { StateCode } from "@/lib/compliance/types";

export type Plan = "trialing" | "scout" | "operator" | "firm" | "canceled";
export type Role = "owner" | "admin" | "member";

export interface FirmRow {
  id: string;
  name: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  state_scope: StateCode[];
  created_at: string;
  updated_at: string;
}

export interface MembershipRow {
  firm_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface DealRow {
  id: string;
  firm_id: string;
  state: StateCode | null;
  status: string;
  draft: unknown;
  analysis: unknown;
  ai_narrative: unknown;
  snapshot_hash: string | null;
  updated_at: string;
  created_at: string;
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase
git commit -m "feat(supabase): browser + server + admin clients"
```

---

## Task 8: Middleware — session refresh + protected routes

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware**

Create `src/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

const PROTECTED = ["/app"];
const AUTH_PAGES = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.some((p) => path === p)) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Smoke**

Run `npm run dev`, open `/app` in an incognito window. Expected: redirect to `/signin?next=%2Fapp`. No errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(middleware): supabase session refresh + auth gate"
```

---

## Task 9: Auth session helpers

**Files:**
- Create: `src/lib/auth/supabase-session.ts`

- [ ] **Step 1: Write helpers**

Create `src/lib/auth/supabase-session.ts`:
```ts
import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { FirmRow, MembershipRow } from "@/lib/supabase/types";

export interface ServerSession {
  userId: string;
  email: string;
  firm: FirmRow;
  membership: MembershipRow;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: membership } = await sb
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<MembershipRow>();
  if (!membership) return null;

  const { data: firm } = await sb
    .from("firms")
    .select("*")
    .eq("id", membership.firm_id)
    .maybeSingle<FirmRow>();
  if (!firm) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    firm,
    membership,
  };
}

export async function requireServerSession(): Promise<ServerSession> {
  const s = await getServerSession();
  if (!s) redirect("/signin");
  return s;
}
```

- [ ] **Step 2: Client `useSession`**

Create `src/lib/auth/use-supabase-session.ts`:
```ts
"use client";
import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface ClientSession {
  userId: string;
  email: string;
}

export function useSupabaseSession(): ClientSession | null {
  const [session, setSession] = React.useState<ClientSession | null>(null);

  React.useEffect(() => {
    const sb = supabaseBrowser();
    let cancelled = false;

    sb.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      setSession({ userId: user.id, email: user.email ?? "" });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s?.user ? { userId: s.user.id, email: s.user.email ?? "" } : null);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return session;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/supabase-session.ts src/lib/auth/use-supabase-session.ts
git commit -m "feat(auth): supabase session helpers (server + client)"
```

---

## Task 10: Firm + membership queries

**Files:**
- Create: `src/lib/firms/queries.ts`

- [ ] **Step 1: Write queries**

Create `src/lib/firms/queries.ts`:
```ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FirmRow, MembershipRow } from "@/lib/supabase/types";
import type { StateCode } from "@/lib/compliance/types";

export async function createFirmForOwner(args: {
  userId: string;
  firmName: string;
  states: StateCode[];
  trialDays?: number;
}): Promise<{ firm: FirmRow; membership: MembershipRow }> {
  const admin = supabaseAdmin();
  const trialEnds = new Date(Date.now() + (args.trialDays ?? 7) * 864e5).toISOString();

  const { data: firm, error: e1 } = await admin
    .from("firms")
    .insert({
      name: args.firmName,
      plan: "trialing",
      state_scope: args.states,
      trial_ends_at: trialEnds,
    })
    .select("*")
    .single<FirmRow>();
  if (e1 || !firm) throw new Error(e1?.message ?? "firm insert failed");

  const { data: membership, error: e2 } = await admin
    .from("memberships")
    .insert({ firm_id: firm.id, user_id: args.userId, role: "owner" })
    .select("*")
    .single<MembershipRow>();
  if (e2 || !membership) throw new Error(e2?.message ?? "membership insert failed");

  return { firm, membership };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firms/queries.ts
git commit -m "feat(firms): createFirmForOwner via service role"
```

---

## Task 11: Waitlist query

**Files:**
- Create: `src/lib/waitlist/queries.ts`

- [ ] **Step 1: Write**

Create `src/lib/waitlist/queries.ts`:
```ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function addWaitlistEntry(args: {
  email: string;
  state: string;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("waitlist").insert({
    email: args.email.toLowerCase().trim(),
    state: args.state.toUpperCase(),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/waitlist/queries.ts
git commit -m "feat(waitlist): service-role insert"
```

---

## Task 12: State picker component

**Files:**
- Create: `src/app/(auth)/signup/_components/state-picker.tsx`

- [ ] **Step 1: Write component**

Create `src/app/(auth)/signup/_components/state-picker.tsx`:
```tsx
"use client";
import * as React from "react";
import { SUPPORTED_STATES } from "@/lib/compliance";
import { cn } from "@/lib/utils";
import type { StateCode } from "@/lib/compliance/types";

export function StatePicker({
  value,
  onChange,
}: {
  value: StateCode[];
  onChange: (next: StateCode[]) => void;
}) {
  function toggle(code: StateCode) {
    onChange(
      value.includes(code) ? value.filter((c) => c !== code) : [...value, code],
    );
  }
  return (
    <div className="grid gap-2">
      <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-forest-700">
        States you operate in
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {SUPPORTED_STATES.map((s) => {
          const active = value.includes(s.code);
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => toggle(s.code)}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition",
                active
                  ? "border-forest-600 bg-forest-600 text-bone"
                  : "border-rule bg-white hover:border-forest-400",
                s.tier === "yellow" && !active && "border-brass-400/40",
              )}
            >
              <div className="font-mono text-xs">{s.code}</div>
              <div className="text-[10px] text-current/70">{s.name}</div>
              {s.tier === "yellow" && (
                <div className="text-[9px] uppercase tracking-[0.16em] mt-1 text-brass-500">
                  disclosure
                </div>
              )}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-clay-500">Pick at least one state.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/signup/_components/state-picker.tsx"
git commit -m "feat(signup): state picker component"
```

---

## Task 13: Signup route handler

**Files:**
- Create: `src/app/api/signup/route.ts`

- [ ] **Step 1: Write handler**

Create `src/app/api/signup/route.ts`:
```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { createFirmForOwner } from "@/lib/firms/queries";
import { addWaitlistEntry } from "@/lib/waitlist/queries";
import { SUPPORTED_STATES } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(SUPPORTED_STATES.map((s) => s.code));

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firmName: z.string().min(2),
  displayName: z.string().min(1),
  states: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }
  const { email, password, firmName, displayName, states } = parsed.data;

  // Split states into supported vs. waitlist
  const supported: StateCode[] = [];
  const unsupported: string[] = [];
  for (const s of states) {
    const up = s.toUpperCase();
    if (ALLOWED.has(up as StateCode)) supported.push(up as StateCode);
    else unsupported.push(up);
  }

  // If ALL states are unsupported → waitlist-only
  if (supported.length === 0) {
    await addWaitlistEntry({ email, state: unsupported.join(",") });
    return NextResponse.json(
      { status: "waitlisted", unsupported },
      { status: 202 },
    );
  }

  // Create auth user (admin API — skips email verification for trial velocity)
  const admin = supabaseAdmin();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (authErr || !created.user) {
    return NextResponse.json(
      { error: authErr?.message ?? "auth create failed" },
      { status: 400 },
    );
  }

  // Create firm + owner membership
  try {
    await createFirmForOwner({
      userId: created.user.id,
      firmName,
      states: supported,
    });
  } catch (e) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "firm create failed" },
      { status: 500 },
    );
  }

  // Log the user in via anon/email+password so cookies are set
  const sb = await supabaseServer();
  const { error: loginErr } = await sb.auth.signInWithPassword({ email, password });
  if (loginErr) {
    return NextResponse.json(
      { error: loginErr.message },
      { status: 500 },
    );
  }

  // Also log any unsupported states to the waitlist for interest signal
  for (const u of unsupported) {
    await addWaitlistEntry({ email, state: u });
  }

  return NextResponse.json({ status: "ok" }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/signup/route.ts
git commit -m "feat(signup): route handler creates auth user + firm + membership"
```

---

## Task 14: New signup page

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Read existing file first**

Run:
```bash
wc -l "/Users/deeppatel/Desktop/wholesail/src/app/(auth)/signup/page.tsx"
```
Note the line count; then `Read` it so we know what to replace.

- [ ] **Step 2: Replace page body**

Rewrite `/Users/deeppatel/Desktop/wholesail/src/app/(auth)/signup/page.tsx`:
```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StatePicker } from "./_components/state-picker";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import type { StateCode } from "@/lib/compliance/types";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [firmName, setFirmName] = React.useState("");
  const [states, setStates] = React.useState<StateCode[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firmName, displayName, states }),
      });
      if (res.status === 202) {
        router.push("/waitlist?state=" + encodeURIComponent(states.join(",")));
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `signup failed: ${res.status}`);
      }
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 max-w-lg mx-auto py-16">
      <h1 className="font-display text-4xl">Start your 7-day trial</h1>
      <p className="text-sm text-forest-700">
        Card-free until day 8. Pick the states your team closes deals in.
      </p>
      <TextField label="Your name" value={displayName} onChange={setDisplayName} required />
      <TextField label="Firm name" value={firmName} onChange={setFirmName} required />
      <TextField label="Work email" type="email" value={email} onChange={setEmail} required />
      <TextField label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
      <StatePicker value={states} onChange={setStates} />
      {error && <p className="text-sm text-clay-500">{error}</p>}
      <Button type="submit" disabled={pending || states.length === 0}>
        {pending ? "Creating…" : "Start trial"}
      </Button>
    </form>
  );
}
```

NOTE: if `@/components/ui/text-field` doesn't exist, inspect the current signup page's form inputs and mirror its input pattern. Do not invent a TextField API.

- [ ] **Step 3: Verify build**

Run:
```bash
npm run dev
```
Open `http://localhost:3000/signup`. Expected: form renders with 14 state chips. No console errors. Submit with a fake email/password + 1 green state → network tab shows POST /api/signup returning 201 → redirect to `/app`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/signup/page.tsx"
git commit -m "feat(signup): firm + state picker + supabase signup flow"
```

---

## Task 15: Waitlist page

**Files:**
- Create: `src/app/waitlist/page.tsx`

- [ ] **Step 1: Write page**

Create `src/app/waitlist/page.tsx`:
```tsx
export default function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  return <WaitlistContent searchParams={searchParams} />;
}

async function WaitlistContent({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const sp = await searchParams;
  const states = sp.state?.split(",").filter(Boolean) ?? [];
  return (
    <main className="max-w-xl mx-auto py-24 px-6 grid gap-6">
      <h1 className="font-display text-4xl">You&rsquo;re on the list.</h1>
      <p className="text-sm text-forest-700 leading-relaxed">
        Wholesail currently operates in 14 states where wholesaling is
        unambiguously legal. We captured your interest in{" "}
        <strong className="font-medium">{states.join(", ") || "unsupported states"}</strong>{" "}
        and will email you the moment coverage expands there.
      </p>
      <p className="text-xs text-forest-600">
        If your firm already holds a broker license in those states,{" "}
        <a href="mailto:team@wholesail.app" className="underline">
          reach out
        </a>{" "}
        — we can onboard you under a manual compliance attestation.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Smoke**

Open `/waitlist?state=IL,NY`. Expected: renders the copy with "IL, NY" highlighted.

- [ ] **Step 3: Commit**

```bash
git add src/app/waitlist/page.tsx
git commit -m "feat(waitlist): red-state fallback page"
```

---

## Task 16: Replace signin page

**Files:**
- Modify: `src/app/(auth)/signin/page.tsx`

- [ ] **Step 1: Read existing file**

`Read` the current signin page so the rewrite preserves any imports/styling primitives used elsewhere.

- [ ] **Step 2: Replace body**

Rewrite `/Users/deeppatel/Desktop/wholesail/src/app/(auth)/signin/page.tsx` to use Supabase:
```tsx
"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/app";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const sb = supabaseBrowser();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setPending(false);
    if (err) return setError(err.message);
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 max-w-sm mx-auto py-24">
      <h1 className="font-display text-4xl">Sign in</h1>
      <TextField label="Email" type="email" value={email} onChange={setEmail} required />
      <TextField label="Password" type="password" value={password} onChange={setPassword} required />
      {error && <p className="text-sm text-clay-500">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Smoke**

Go to `/signin`, enter the credentials from signup. Expected: redirect to `/app`, session cookie set (check DevTools → Application → Cookies: look for `sb-<project>-auth-token`).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/signin/page.tsx"
git commit -m "feat(signin): supabase password auth"
```

---

## Task 17: Deal store backed by Supabase

**Files:**
- Create: `src/lib/deals/supabase-store.ts`
- Modify: `src/lib/deals/store.ts`

- [ ] **Step 1: Read current `store.ts`**

`Read` `/Users/deeppatel/Desktop/wholesail/src/lib/deals/store.ts` so the new Supabase-backed API matches the current export surface exactly. Note:
- Shape of `SavedDeal`
- Exports (`useDeals`, etc.)
- Any `patch(id, fields)` signature

- [ ] **Step 2: Write Supabase-backed queries**

Create `src/lib/deals/supabase-store.ts`. The key functions (match current names):
```ts
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { SavedDeal } from "./store";
import type { DealRow } from "@/lib/supabase/types";

function fromRow(r: DealRow): SavedDeal {
  return {
    id: r.id,
    draft: r.draft as SavedDeal["draft"],
    analysis: r.analysis as SavedDeal["analysis"],
    aiNarrative: r.ai_narrative as SavedDeal["aiNarrative"],
    aiDocs: undefined, // TODO in P4
    state: r.state ?? undefined,
    status: r.status as SavedDeal["status"],
    updatedAt: r.updated_at,
    createdAt: r.created_at,
  };
}

export async function listDeals(): Promise<SavedDeal[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("deals")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DealRow[]).map(fromRow);
}

export async function insertDeal(firmId: string, draft: SavedDeal["draft"]): Promise<SavedDeal> {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("deals")
    .insert({ firm_id: firmId, draft, state: draft?.state ?? null, status: "draft" })
    .select("*")
    .single<DealRow>();
  if (error || !data) throw error ?? new Error("insert failed");
  return fromRow(data);
}

export async function patchDeal(id: string, patch: Partial<SavedDeal>): Promise<void> {
  const sb = supabaseBrowser();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("draft" in patch) row.draft = patch.draft;
  if ("analysis" in patch) row.analysis = patch.analysis;
  if ("aiNarrative" in patch) row.ai_narrative = patch.aiNarrative;
  if ("status" in patch) row.status = patch.status;
  if ("state" in patch) row.state = patch.state;
  const { error } = await sb.from("deals").update(row).eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Rewrite `store.ts` to proxy to Supabase**

Modify `src/lib/deals/store.ts` so the existing client hooks become thin proxies to `supabase-store.ts`. Preserve the exported `SavedDeal` type and the `useDeals()` shape. Add a `useDeals()` that now:
- Uses `useEffect` to call `listDeals()` on mount
- Subscribes to Supabase realtime channel `deals` filtered by `firm_id`
- Replaces the prior localStorage write paths with `insertDeal`/`patchDeal`
- Keeps a small localStorage fallback ONLY when `useSupabase === false` (for legacy dev)

Gate with `useSupabase` flag:
```ts
import { useSupabase } from "@/lib/env";
// if (!useSupabase) → legacy localStorage path; else → supabase path
```

- [ ] **Step 4: Typecheck**

Run `npx tsc --noEmit`. Fix any callsite that passed a shape the Supabase path doesn't accept.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deals/store.ts src/lib/deals/supabase-store.ts
git commit -m "feat(deals): supabase-backed store behind useSupabase flag"
```

---

## Task 18: One-time localStorage migration

**Files:**
- Create: `src/lib/deals/migrate.ts`

- [ ] **Step 1: Write migration**

Create `src/lib/deals/migrate.ts`:
```ts
"use client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { SavedDeal } from "./store";

const LS_KEY = "wholesail:deals:v1";
const MIGRATED_KEY = "wholesail:deals:migrated";

export async function migrateLocalDealsToSupabase(firmId: string): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (window.localStorage.getItem(MIGRATED_KEY) === "yes") return 0;
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) { window.localStorage.setItem(MIGRATED_KEY, "yes"); return 0; }

  let deals: SavedDeal[] = [];
  try { deals = JSON.parse(raw); } catch { return 0; }

  const sb = supabaseBrowser();
  const rows = deals.map((d) => ({
    firm_id: firmId,
    state: d.state ?? null,
    status: d.status ?? "draft",
    draft: d.draft,
    analysis: d.analysis ?? null,
    ai_narrative: d.aiNarrative ?? null,
    updated_at: d.updatedAt ?? new Date().toISOString(),
    created_at: d.createdAt ?? new Date().toISOString(),
  }));

  if (rows.length === 0) {
    window.localStorage.setItem(MIGRATED_KEY, "yes");
    return 0;
  }

  const { error } = await sb.from("deals").insert(rows);
  if (error) throw error;

  window.localStorage.setItem(MIGRATED_KEY, "yes");
  return rows.length;
}
```

- [ ] **Step 2: Call on first app load**

Modify `src/app/app/layout.tsx` (or the topmost client component that reads the session) to call `migrateLocalDealsToSupabase(session.firm.id)` once after login:
```tsx
"use client";
import * as React from "react";
import { migrateLocalDealsToSupabase } from "@/lib/deals/migrate";
// ...
React.useEffect(() => {
  if (!firmId) return;
  migrateLocalDealsToSupabase(firmId).catch(console.warn);
}, [firmId]);
```

- [ ] **Step 3: Smoke**

Sign in as a test user. Expected: deals previously created in localStorage now show in pipeline. Refresh with localStorage cleared — deals still there (they came from Supabase).

- [ ] **Step 4: Commit**

```bash
git add src/lib/deals/migrate.ts src/app/app/layout.tsx
git commit -m "feat(deals): one-time localStorage → supabase migration"
```

---

## Task 19: App header + layout read Supabase session

**Files:**
- Modify: `src/app/app/layout.tsx`
- Modify: `src/app/app/_components/app-header.tsx` (or wherever the signed-in name renders)

- [ ] **Step 1: Server session in layout**

Modify `src/app/app/layout.tsx` to call `requireServerSession()` at the top:
```tsx
import { requireServerSession } from "@/lib/auth/supabase-session";
// at top of the default export (server component)
const session = await requireServerSession();
// pass session.firm.name + role to header via props or context
```

Remove the legacy `useSession()` import from `@/lib/auth/session` from the layout.

- [ ] **Step 2: Header shows firm name**

Edit `src/app/app/_components/app-header.tsx`:
- Replace `useSession()` from the old module with a prop-driven firm/user from the layout
- Display firm name next to the user's email
- Sign-out button calls `supabaseBrowser().auth.signOut()` then `router.push("/")`

- [ ] **Step 3: Smoke**

Log in. Expected: header shows the firm name you set at signup. Sign out button works — clears the cookie, redirects to `/`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/app/layout.tsx" "src/app/app/_components/app-header.tsx"
git commit -m "feat(app): layout + header read supabase session"
```

---

## Task 20: RLS integration test (manual but scripted)

**Files:**
- Create: `supabase/tests/rls_smoke.sql`

- [ ] **Step 1: Write a simple SQL smoke test**

Create `supabase/tests/rls_smoke.sql`:
```sql
-- Manual smoke: run via psql against the remote Supabase DB.
-- Expects two test users + two firms already seeded (see comments).
-- This is a shell until we install pgTap in P2.

-- 1. User A should see A's deal
set local role authenticated;
set local request.jwt.claims to '{"sub":"<USER_A_UUID>"}';
select count(*) from public.deals;  -- Expected: = N_A (their count)
reset role;

-- 2. User A should NOT see B's deal
set local role authenticated;
set local request.jwt.claims to '{"sub":"<USER_A_UUID>"}';
select count(*) from public.deals where firm_id = '<FIRM_B_UUID>';
-- Expected: 0
reset role;
```

- [ ] **Step 2: Execute the smoke**

Open Supabase dashboard → SQL Editor → paste the smoke SQL substituting real UUIDs from two test accounts. Verify the expected counts.

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/rls_smoke.sql
git commit -m "test(rls): manual smoke template for tenant isolation"
```

---

## Task 21: Legacy auth deprecation

**Files:**
- Modify: `src/lib/auth/session.ts`

- [ ] **Step 1: Add deprecation banner**

At the top of `src/lib/auth/session.ts`:
```ts
/**
 * @deprecated Replaced by `src/lib/auth/supabase-session.ts` + Supabase Auth.
 * This module remains only for the one-time localStorage migration path.
 * Delete after two clean weeks of Supabase-only auth (target: 2026-05-06).
 */
```

- [ ] **Step 2: Grep for remaining consumers**

Run:
```bash
grep -rn "from \"@/lib/auth/session\"" /Users/deeppatel/Desktop/wholesail/src
```
Expected: zero matches. If any remain, rewrite them to `@/lib/auth/supabase-session` or `@/lib/auth/use-supabase-session`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/session.ts
git commit -m "chore(auth): deprecate localStorage session in favor of supabase"
```

---

## Task 22: Final smoke + flag flip

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Flip the flag**

In `.env.local`, set:
```
NEXT_PUBLIC_USE_SUPABASE=true
```

- [ ] **Step 2: Full flow**

1. Clear browser cookies + localStorage for localhost:3000
2. Visit `/signup` → create firm "Deep's Test LLC" → pick OH + TN + a red state (e.g., NY) → submit
3. Expected: redirected to `/app`. Open DevTools → Application → sb-\*-auth-token cookie set.
4. Create a new deal for an OH property.
5. Open Supabase dashboard → Table Editor → `deals` — row present, `firm_id` set, your user is the only one who can read it.
6. Check `waitlist` — NY row present for your email.
7. Sign out → re-signin → deal still present.

- [ ] **Step 3: Commit final state**

If all green:
```bash
git add .
git commit -m "chore: enable supabase auth flag"
```

---

## Post-P1 checklist

- [ ] All 22 tasks committed
- [ ] `NEXT_PUBLIC_USE_SUPABASE=true` in local + Vercel env
- [ ] RLS smoke SQL verifies cross-firm isolation
- [ ] No remaining imports from `@/lib/auth/session` except migration helper
- [ ] Signup → firm → membership creation works end-to-end
- [ ] Waitlist captures red-state attempts
- [ ] Legacy localStorage deals migrated on first Supabase login
- [ ] PA removed from `SUPPORTED_STATES`; 14 states live

## What unblocks next

- **P2 (Stripe + pricing + OH/FL enforcement)** — can now store `stripe_customer_id` on firms and write webhook handlers that update `firms.plan`
- **P3 (Pro math)** — independent, can start in parallel
- **P4 (KB + AI inspector)** — `kb_chunks` table ready, `ai_runs` table ready
