<p align="center">
  <img src="./docs/banner.svg" alt="Wholesail — Operator-grade deal infrastructure for real-estate wholesalers." width="100%"/>
</p>

<p align="center">
  <b>Wholesail</b> is the operating system for serious real-estate
  wholesalers. Underwrite the math, run an AI deal inspector grounded in a
  state-specific legal corpus, enforce in-app compliance for the states that
  regulate assignment, and hand attorney-ready paperwork to counsel — all on
  one ledger.
</p>

<p align="center">
  <a href="#"><img alt="Next.js 16"   src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs&logoColor=white"/></a>
  <a href="#"><img alt="React 19"     src="https://img.shields.io/badge/React-19.2-149ECA?style=flat-square&logo=react&logoColor=white"/></a>
  <a href="#"><img alt="TypeScript"   src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white"/></a>
  <a href="#"><img alt="Supabase"     src="https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/></a>
  <a href="#"><img alt="Anthropic"    src="https://img.shields.io/badge/Claude-Sonnet%204.6-d6b877?style=flat-square"/></a>
  <a href="#"><img alt="Voyage"       src="https://img.shields.io/badge/Voyage-voyage--3-1a3a2a?style=flat-square"/></a>
  <a href="#"><img alt="Beta"         src="https://img.shields.io/badge/status-beta-b08d57?style=flat-square"/></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT%20%2B%20Commons--Clause-1a3a2a?style=flat-square"/></a>
</p>

---

## What Wholesail does

Real-estate wholesalers spend the first hour of every deal in a tab-storm:
underwrite the math in a calculator, second-guess the comps, eyeball the
state law, beg an attorney for paperwork. Wholesail collapses that into
**one ledger** with four spines:

1. **Underwrite** — pure-math wholesale / fix-and-flip / buy-and-hold
   engines with min-percentile comp logic and a `Pursue / Review / Pass`
   verdict.
2. **Inspect** — the **AI Deal Inspector** runs Claude over the deal with
   retrieval grounding from a per-state knowledge base, returns a leverage
   score, deal-killers with negotiation angles, opportunities, comps still
   needed, and a defended suggested offer.
3. **Enforce** — in-app gates for the states that actually regulate
   assignment (OH SB 131 disclosure modal, FL HB 1049 72-hour cooldown
   countdown), plus warnings for advisory states.
4. **Close** — generate Letter of Intent, PSA, and Assignment of Contract
   from per-state templates, export to PDF via the browser print pipeline,
   hand to your attorney.

> Wholesail is **not a law firm.** Every document is a starter template
> reviewed by a licensed attorney before any party signs.

---

## Feature grid

| Surface | What it does |
| --- | --- |
| **Cinematic hero** (`/`) | Looping video, liquid-glass CTAs, pricing tiers. |
| **Pipeline** (`/app`) | Prospect → Under contract → Closed columns, freshness ribbons, advance + remove with confirm. |
| **New Deal wizard** (`/app/deals/new`) | Strategy → State → Property (paste-to-parse address) → Remarks → Analyze (motion overlay) → Review. |
| **Deal detail** (`/app/deals/[id]`) | Analysis tabs, AI Inspection section, OSM map panel, compliance gates, document drafts. |
| **AI Deal Inspector** | Claude tool-use with retrieval over per-state KB chunks; cached on snapshot hash; per-tier daily quota. |
| **Compliance enforcement** | OH disclosure-acknowledgement modal blocks contract status; FL cooldown banner counts down 72 h before send-to-buyer. |
| **OSM map panel** | Server-side Nominatim geocode, cached lat/lon, static-tile preview, deep-link to Google Maps. |
| **Dark mode** | `next-themes` toggle, deeper-forest + amber accent palette, paper-grain suppressed. |
| **Print-to-PDF** | `/print/[docType]?deal=…` letter-paged CSS, no PDF library dep. |
| **Accessibility** | Skip-link, visible focus rings, keyboard-reachable menus, `text-wrap: balance`. |

---

## Pricing tiers

| Tier | Audience | Daily AI inspections | Notes |
| --- | --- | --- | --- |
| **Trial** | New accounts, 14 days | 5 | Full feature surface, no card required. |
| **Scout** | Hobby / 1 deal at a time | 0 | Math + compliance + paperwork only — AI off. |
| **Operator** | Active wholesaler | 20 | The default plan. Sonnet inference. |
| **Firm** | Multi-acquisitions team | 50 | Opus inference, white-label PDFs roadmap. |

Quotas reset at UTC midnight. Stripe checkout + portal land in P7.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Runtime | React 19.2 — `useSyncExternalStore`, `use(params)`, server actions |
| Language | TypeScript 5 (strict) |
| Styles | Tailwind CSS v4 (`@theme`, `@custom-variant dark`) |
| Variants | `class-variance-authority` |
| Theme | `next-themes` (class strategy) |
| Auth + DB | Supabase (Postgres + auth + RLS, session pooler) |
| Vector | pgvector — ivfflat cosine, 1024-dim |
| Embeddings | Voyage AI `voyage-3` |
| Inference | Anthropic — `claude-sonnet-4-6` (Operator), `claude-opus-4-7` (Firm) |
| Geocoding | OpenStreetMap Nominatim (1.1 s throttle, UA header) |
| Map tiles | `staticmap.openstreetmap.de` (no JS map lib) |
| Validation | Zod v4 |
| Tests | Vitest 4 |
| Print/PDF | Native browser `@page` + `@media print` |

---

## Quick start

### Prerequisites

- Node 20+, npm
- A Supabase project (free tier is fine)
- Anthropic API key
- Voyage API key

### Install

```bash
git clone https://github.com/reallydeep/wholesail.git
cd wholesail
npm install
```

### Environment

Create `.env.local` at the repo root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=postgres://postgres.<ref>:<password>@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# AI
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=

# (P7 — Stripe — not required to run today)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Database

Apply the migrations under `supabase/migrations/` in order. Each migration
is idempotent and `0000_init.sql` enables `pgvector`.

### Knowledge base

Populate the per-state KB used by the AI Deal Inspector:

```bash
npm run ingest:kb
```

This fetches the resimpli per-state guides, chunks them on heading
boundaries, embeds with `voyage-3`, and writes to `kb_chunks`.

### Develop

```bash
npm run dev          # Turbopack on :3000
npm run build        # production build
npm run start        # serve the build
npm run lint         # ESLint (React 19 purity rules)
npm test             # Vitest
```

Open <http://localhost:3000>, sign up, walk a deal through the wizard,
click **Run inspection** on the deal page.

---

## How it fits together

```
   ┌──────────────────────┐
   │  /  cinematic hero   │
   └──────────┬───────────┘
              ▼
   ┌──────────────────────┐    Supabase auth + memberships
   │  /signup  /signin    │ ─► firm row, plan = "trialing"
   └──────────┬───────────┘
              ▼
   ┌──────────────────────┐    deals table (RLS by firm_id)
   │  /app  pipeline      │ ◄────────────────────────────┐
   └──────────┬───────────┘                              │
              ▼                                          │
   ┌──────────────────────────────────────────┐          │
   │  /app/deals/new  six-step wizard         │          │
   │  strategy → state → property → remarks   │          │
   │           → analyze → review             │          │
   └──────────────────────┬───────────────────┘          │
                          │                              │
              ┌───────────┼───────────────┐              │
              ▼           ▼               ▼              │
       lib/analysis  lib/compliance  lib/templates       │
       (pure math)   (state rules)   (LOI/PSA/Assign)    │
                          │                              │
                          ▼                              │
              ┌──────────────────────┐  save / update    │
              │  /app/deals/[id]     │ ──────────────────┘
              │  analysis · map ·    │
              │  AI inspection ·     │  POST /api/deals/:id/inspect
              │  disclosure modal ·  │  ↳ snapshot hash → cache
              │  cooldown banner     │  ↳ retrieve KB → Claude
              └──────────┬───────────┘  ↳ tool-use → DealInspection
                         ▼
              ┌──────────────────────┐
              │  /print/[docType]    │ → browser Save-as-PDF
              └──────────────────────┘
```

---

## AI Deal Inspector — how it works

1. **Snapshot hash** — the deal draft + analysis are stable-stringified and
   FNV-1a hashed. Identical hash → cached inspection returned instantly.
2. **Retrieve** — the deal address, state, and strategy seed a Voyage
   `voyage-3` query embedding; `kb_match` (pgvector) returns the 8 nearest
   chunks for the deal&rsquo;s state plus state-agnostic context.
3. **Inspect** — Claude is called with `tool_choice: record_inspection`.
   The tool schema enforces `evidence: string`, `state_citation`, and
   `suggested_offer ≤ purchase − deductions`. Output is validated with
   Zod before being persisted.
4. **Quota** — the `ai_runs` table records every successful run; daily
   limits per firm tier are checked before the LLM call.
5. **Render** — `LeverageGauge`, `DealKillers` (severity-sorted, copy
   negotiation angle), `OpportunitiesPanel`, `CompsNeeded` consume the
   inspection. The suggested-offer card sits at the top.

---

## Compliance enforcement

| State | What ships in-app | Artifact |
| --- | --- | --- |
| **OH** | Mark-under-contract is gated by the SB 131 disclosure modal until acknowledged. | `disclosures_ack` row JSON |
| **FL** | A 72-hour cooldown banner counts down from `contract_at`; send-to-buyer is gated until expiry per HB 1049. | `flCooldownExpiresAt()` + `canSendToBuyer()` |
| **PA / others** | Advisory warnings via `lib/compliance/rules/<state>.ts`. | `ComplianceDecision.warnings[]` |

Adding a state is a `rules/<state>.ts` + a disclosure copy file +
(optionally) a hard gate in `enforcement.ts`.

---

## Project structure

```
wholesail/
├── docs/
│   ├── banner.svg                          # README banner
│   └── superpowers/                        # specs + plans
├── supabase/
│   └── migrations/                         # 0000…0006_*.sql
├── scripts/
│   └── ingest-kb.ts                        # KB ingest CLI (tsx)
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── api/
│   │   │   ├── ai/{analyze,doc}/route.ts
│   │   │   ├── deals/[id]/inspect/route.ts # AI Deal Inspector
│   │   │   └── deals/[id]/geocode/route.ts # Nominatim cache
│   │   ├── app/
│   │   │   ├── layout.tsx                  # nav + ThemeToggle
│   │   │   ├── page.tsx                    # pipeline
│   │   │   └── deals/{new,[id]}/...        # wizard + detail
│   │   ├── print/[docType]/                # PDF route
│   │   ├── globals.css                     # tokens · light/dark · print
│   │   └── layout.tsx                      # ThemeProvider mount
│   ├── components/
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── ui/                             # Button, Badge, Card, Input
│   └── lib/
│       ├── ai/inspector/                   # schema, prompt, run, hash
│       ├── analysis/                       # underwriting math
│       ├── auth/                           # Supabase session helpers
│       ├── compliance/{enforcement,rules,disclosures}
│       ├── deals/{store,migrate}.ts
│       ├── geo/nominatim.ts                # geocode w/ throttle
│       ├── kb/{ingest,chunk,voyage,retrieve,sources,html-to-md}.ts
│       ├── math/                           # min-percentile comp logic
│       ├── supabase/{browser,server,admin}.ts
│       └── templates/{docs,clauses,render}.ts
└── package.json
```

---

## Roadmap

- [x] Underwriting engine (wholesale / flip / hold)
- [x] Six-step new-deal wizard with motion overlay
- [x] Pipeline + deal detail pages
- [x] Cinematic landing + pricing tiers
- [x] Supabase auth + RLS + memberships
- [x] AI doc generation with staleness detection
- [x] AI Deal Inspector (Voyage + Claude tool-use, snapshot-hash cache)
- [x] OH SB 131 + FL HB 1049 in-app enforcement
- [x] OSM static map panel + Nominatim geocode cache
- [x] Dark mode (next-themes)
- [ ] Stripe checkout + Customer Portal + webhook (P7)
- [ ] Five more state rule sets: TX, GA, TN, MI, NC
- [ ] Inline e-signature
- [ ] White-label PDFs on Firm tier
- [ ] Multi-user firms (invitations + roles)

---

## Contributing

See [`CONTRIBUTORS.md`](./CONTRIBUTORS.md). Open an issue before any
non-trivial PR. Run `npm run lint`, `npm run build`, and `npm test` before
opening one.

---

## License

[MIT, with the Commons Clause restriction.](./LICENSE) You may use, fork,
modify, and self-host Wholesail freely. You may not resell it as a hosted
service. Contributions are welcome under the same terms.

---

## Legal disclaimer

**Wholesail is a software tool. It is not a law firm and does not provide
legal advice.** Every document generated by Wholesail is a starter
template that must be reviewed by a licensed attorney in the relevant
jurisdiction before any party signs. Wholesail, its contributors, and its
operators disclaim any liability for use of generated documents without
attorney review.

---

<p align="center">
  <sub>Built for dealmakers who keep their paperwork sharp.</sub><br/>
  <sub>&copy; 2026 Deep Patel and Wholesail contributors. MIT + Commons Clause.</sub>
</p>
