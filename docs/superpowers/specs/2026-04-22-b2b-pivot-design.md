# Wholesail — B2B SaaS Pivot + Pro Math + AI Deal Inspector

**Date:** 2026-04-22
**Status:** Approved design — ready for implementation planning
**Owner:** Deep Patel

---

## 1. Context

Wholesail launched as a direct-wholesaler tool for OH/PA/FL. Two problems surfaced:

1. **Legal exposure** — direct wholesaling may require broker licensing in multiple states; transparency + assignment disclosure rules vary and are enforced differently.
2. **TAM ceiling** — solo wholesalers are a narrow buyer pool.

This pivot addresses both by (a) repositioning to **B2B SaaS for licensed investors + brokerages** and (b) restricting the operating footprint to **14 US states** where wholesaling is unambiguously legal. Licensing exposure shifts from us to the customer (who attests they hold a license or operate in a no-license-required state). We sell tooling; they close deals.

## 2. Goals / Non-Goals

**Goals (in scope for this pivot):**
- Ship a card-capture trialing SaaS with Supabase + Stripe
- Institutional-grade real-estate math (wholesale, flip, BRRRR) with all inputs connected
- AI-powered "Deal Killer" inspector that produces state-law-aware negotiation leverage
- State-law knowledge base seeded from resimpli.com, monthly re-ingest
- Subtle OSM map (free) replacing the earlier Google Maps idea
- Dark mode for hero + dashboard
- Professional README + SVG banner + MIT (+ Commons Clause) license

**Non-goals (explicitly deferred):**
- Street View / Google Places / satellite view
- Live comp sourcing (Zillow/Redfin scrape)
- Stripe Connect / commission-based billing
- Team invite UX (v1.1)
- SSO, SCIM
- 1031 exchange math, cost-seg, tax-adjusted IRR
- Blog, docs site

## 3. Architecture

```
Next.js 16 App Router ─ Vercel (Pro)
       │
       ├── Supabase
       │     • Postgres with RLS per firm_id
       │     • Auth (email+password + magic link)
       │     • Storage (generated PDFs)
       │     • pgvector for KB embeddings
       │
       ├── Stripe
       │     • Checkout (card required, 7-day trial)
       │     • Customer Portal
       │     • Webhooks → firm provisioning
       │
       ├── Anthropic API
       │     • Sonnet 4.6 default (Scout/Operator)
       │     • Opus 4.7 on Firm tier + high-value docs
       │     • Prompt cache on KB chunks
       │
       ├── Voyage AI embeddings (text-embed-3)
       │
       └── OpenStreetMap via Leaflet (no key, no cost)
```

### Data model

| Table | Purpose | Key columns |
|---|---|---|
| `firms` | tenant | id, name, plan (scout/operator/firm), stripe_customer_id, trial_ends_at, state_scope[] |
| `users` | supabase-auth mirror | id, email, display_name |
| `memberships` | user↔firm | firm_id, user_id, role (owner/admin/member) |
| `deals` | deal lifecycle | firm_id, draft(jsonb), analysis(jsonb), ai_narrative(jsonb), state, status, snapshot_hash, updated_at |
| `docs` | generated files | deal_id, kind, body, source, input_hash, pdf_url |
| `ai_runs` | audit trail | deal_id, kind, input_hash, prompt_tokens, cost_cents, created_at |
| `kb_chunks` | state-law RAG | state, section, content, embedding(vector), source_url, verified_at |
| `waitlist` | red-state captures | email, state, submitted_at |

**RLS policy:** every read/write on `deals|docs|ai_runs` gated by `firm_id ∈ (SELECT firm_id FROM memberships WHERE user_id = auth.uid())`.

## 4. State scope

**Launch footprint: 14 states.**

- **Green (13, no disclosure burden):** AL, CO, GA, KS, MI, MO, NC, SC, TN, TX, VA, WI, WV
- **Yellow (2, disclosure enforced in-app):**
  - **OH** (SB131) — required checkbox at "mark under contract"; equitable-interest disclosure PDF auto-attached
  - **FL** (HB1049) — 3-day cancel notice PDF attached + 72hr timer blocks "send to buyer" action
- **Red (everything else):** signup attempt → waitlist page; captures email + state.

## 5. Pricing

Flat SaaS, card-capture, 7-day trial, annual 20% off.

| Tier | Monthly | Annual | Seats | Highlights |
|---|---|---|---|---|
| **Scout** | $79 | $759 ($63/mo) | 1 | 25 deals/mo, basic math, no AI, OSM map, branded docs |
| **Operator** ⭐ | $199 | $1,908 ($159/mo) | 3 | Unlimited deals, pro math, 20 AI inspections/day, 100 AI docs/mo |
| **Firm** | $499 | $4,788 ($399/mo) | 10 | White-label docs, API, CSV, 50 AI inspections/day, Opus tier |

Retention mechanics: card required day 0; first charge auto-converts; cancel flow offers 30-day pause before quit.

## 6. Pro Math Engine

Rebuilt in `src/lib/math/`. All inputs share a single source of truth per deal — changing ARV cascades to MAO, flip profit, and BRRRR refi simultaneously.

### Shared inputs
```
ARV, purchase_price, rehab_cost, holding_months, interest_rate,
down_pct, closing_buy_pct (default 2%), closing_sell_pct (default 8%),
property_tax_annual, insurance_annual, hoa_monthly, utilities_monthly,
market_rent_monthly, vacancy_pct (8%), mgmt_pct (8%),
maintenance_pct (5%), capex_pct (5%)

// Derived once, reused everywhere:
down_payment = purchase_price × down_pct
loan_amount  = purchase_price − down_payment
// mortgage_payment(principal, annual_rate, term_years) uses standard
// amortization: P × (r/12) / (1 − (1+r/12)^−n)
```

### Wholesale (`wholesale.ts`)
```
MAO              = (ARV × 0.70) − rehab − target_assignment_fee
assignment_fee   = max(5000, ARV × 0.02)
spread           = MAO − purchase_price
equity_to_buyer  = ARV − MAO − rehab
```

### Fix & Flip (`flip.ts`)
```
acquisition_cost = purchase_price + (purchase_price × closing_buy_pct)
holding_cost     = holding_months × (
                     (purchase_price × interest_rate / 12) +
                     (property_tax_annual / 12) +
                     (insurance_annual / 12) +
                     hoa_monthly + utilities_monthly
                   )
selling_cost     = ARV × closing_sell_pct
total_cost       = acquisition_cost + rehab + holding_cost + selling_cost
net_profit       = ARV − total_cost
roi              = net_profit / (down_payment + rehab + holding_cost)
annualized_roi   = roi × (12 / holding_months)
```
**70% Rule sanity check:** `purchase_price > (ARV × 0.70) − rehab` → flag thin deal.

### Buy & Hold / BRRRR (`hold.ts`)
```
gross_rent        = market_rent_monthly × 12
effective_rent    = gross_rent × (1 − vacancy_pct)
operating_expense = property_tax_annual + insurance_annual + hoa_monthly×12 +
                    effective_rent × (mgmt_pct + maintenance_pct + capex_pct)
NOI               = effective_rent − operating_expense
cap_rate          = NOI / purchase_price
debt_service      = mortgage_payment(loan_amount, rate, 30yr) × 12
cash_flow         = NOI − debt_service
cash_on_cash      = cash_flow / (down_payment + rehab + closing_buy)
DSCR              = NOI / debt_service
one_pct_rule      = market_rent_monthly / purchase_price ≥ 0.01
BRRRR_refi_out    = (ARV × 0.75) − loan_payoff
```

### State-law tie-in
- FL → `flip.effective_close_date = contract_date + 3 business days`
- OH → adds small time/effort factor for equitable-interest disclosure step

### UI surface
- "Pro Math" toggle on analysis tab (on by default for Operator/Firm)
- Sensitivity sliders: ARV ±10%, rehab ±20%, days-on-market
- Math result exported as JSON on deal snapshot for AI inspector to consume

## 7. AI Deal Inspector

**Trigger:** deal save OR snapshot hash change → 30s debounced background job.

**Input context:** full snapshot + math result (AI interprets, doesn't recompute) + state-scoped KB chunks + city/zip macro from seeded static table (~400 counties from FRED + Redfin dumps; swap to live feed in v1.1).

**Output schema (strict JSON):**
```ts
type DealInspection = {
  leverage_score: number,         // 0..100, 100 = max buyer leverage
  suggested_offer: number,
  confidence: "low" | "medium" | "high",
  killers: Array<{
    severity: "critical" | "major" | "minor",
    category: "title" | "structural" | "market" | "legal"
            | "financial" | "tenant" | "environmental" | "timeline",
    headline: string,
    detail: string,
    negotiation_angle: string,    // literal script seller can read
    evidence: string,             // which snapshot field triggered it
    state_citation?: string       // e.g. "OH SB131 §5301.99"
  }>,
  opportunities: Array<{ headline: string, detail: string, action: string }>,
  comparables_needed: string[]
}
```

Killers without `evidence` are filtered out (anti-hallucination guard).

### KB pipeline (one-time + monthly cron)

1. Fetch `resimpli.com/blog/wholesaling-laws-and-regulations` + per-state sub-pages
2. HTML → markdown → chunk at 500 tokens w/ 50-token overlap
3. Embed with Voyage AI (`voyage-3`, $0.12/MTok)
4. Upsert into `kb_chunks` with state, section, source_url, content, embedding, verified_at
5. Per inspection: top-5 chunks for `deal.state` injected into system prompt

### UI
- "Deal Killers" section on deal detail — severity-sorted cards, color-coded
- Each card: headline, detail, copy-to-clipboard "Negotiation angle" button, state citation chip if present
- Leverage score rendered as horizontal gauge (0 seller-powered, 100 buyer-owns-table)

### Rate limits
- Scout: inspector disabled
- Operator: 20 inspections/day
- Firm: 50 inspections/day
- Sentry alert at 2× expected spend

## 8. Map (Pivot-04)

- Leaflet + OSM tile, 280×180 rounded panel on deal sidebar
- Muted grayscale CSS filter to match brand
- Nominatim geocode (free, client-throttled 1 req/sec)
- Below tile: small text link "Open in Google Maps →" (new tab)
- Address fails → tile hidden entirely. No eyesore.

## 9. Design polish (Pivot-05)

- Dark mode via `next-themes` toggle in nav
- Hero + dashboard re-designed (not inverted) — deeper forest, amber accent
- Full taste-skill pass on buttons: no truncation, no cut-offs, consistent destructive pattern (clay-500 + confirmation dialog)
- Skeleton states on all async screens
- Axe-core a11y pass on dark palette

## 10. Ship kit (Pivot-06)

- README rewrite — B2B positioning, feature grid, pricing, roadmap, stack, setup
- New SVG banner — Silicon Valley startup aesthetic (dark w/ geometric depth + brass accent + Wholesail wordmark); 2 options presented before final pick
- MIT **+ Commons Clause** — open for read/fork, blocks commercial resale of the codebase itself (precedent: Redis, Sentry, Elastic)
- `CONTRIBUTORS.md` with Deep Patel as founder + maintainer
- Push to `main`

## 11. Rollout

Ten waves, each one PR behind a feature flag.

| Wave | Scope | Depends | Effort | Flag |
|---|---|---|---|---|
| W1 | Supabase schema + RLS + migration from localStorage | — | 1.5d | `supabase` |
| W2 | Auth + firm/role + state-gate + signup | W1 | 1d | `supabase` |
| W3 | Stripe Checkout + webhook + Portal + pricing page | W2 | 1d | — |
| W4 | OH/FL enforcement + disclosure PDFs | W2 | 0.5d | — |
| W5 | Pro math engine + sensitivity UI | — | 1.5d | `proMath` |
| W6 | KB ingest + embeddings seed | W1 | 0.5d | — |
| W7 | AI inspector route + UI | W5+W6 | 1.5d | `aiInspector` |
| W8 | OSM map + geocode | — | 0.5d | `map` |
| W9 | Dark mode + button/taste audit | all | 1d | `darkMode` |
| W10 | README + banner + license + push | all | 0.5d | — |

**Total: ~9.5 dev days.** Waves 1–3 are the revenue gate.

### Verification gates

- **W1 → W2:** RLS policy tests prove no cross-firm read
- **W3 → live:** Stripe test card → webhook → firm provisioned → `/app` loads
- **W4 → merge:** FL fixture timer blocks send until 72hr passes; OH fixture requires checkbox
- **W5 → merge:** golden-file math tests with known inputs → exact expected outputs
- **W7 → merge:** 3 seeded deals (OH, FL, TN) each surface ≥1 state-cited killer
- **W9 → merge:** Playwright screenshot diff across light/dark + mobile/desktop, no truncation

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RLS mis-config leaks data cross-firm | Med | Critical | Dedicated RLS test suite; manual pen-test before W3 |
| Anthropic API spend spikes | Med | High | Per-firm daily cap; Sentry alert at 2× expected; Sonnet default |
| OH/FL legal exposure despite enforcement | Low | Critical | ToS disclaimer; logged disclosure artifacts for defense |
| Stripe webhook misses → paid user, no access | Med | High | Idempotency keys + reconciliation cron + stuck-provisioning fallback |
| KB stale when state law changes | High | Med | Monthly re-ingest cron + `verified_at` banner |
| Cease-and-desist despite B2B positioning | Low | Critical | ToS attestation of license OR state-exempt operation |
| AI hallucinates a killer | Med | Med | Required `evidence` field; UI filters killers with missing evidence |
| Dark mode contrast failure | Med | Low | Axe-core gate in W9 |

## 13. Cost model

| Stage | MRR | Total infra+AI+Stripe cost | Margin |
|---|---|---|---|
| Dev-only (0 users) | $0 | ~$25/mo | — |
| 10 paid | $2,050 | ~$120/mo | 94% |
| 100 paid | $20,500 | ~$1,020/mo | 95% |
| 500 paid | $102,500 | ~$5,270/mo | 95% |

**Break-even:** 1 Operator subscriber covers all infra until ~40 users.

## 14. Success criteria

**Technical (end of W10):**
- All 10 waves merged to main
- Supabase RLS tests green
- Stripe test + live mode both verified
- Math golden-file tests green
- AI inspector returns state-cited killers on seeded fixtures
- Lighthouse ≥ 90 on /, /pricing, /app (light + dark)

**Business (30 days post-launch):**
- ≥ 5 paying Operator subscribers
- ≥ 1 Firm subscriber
- < $50/mo Anthropic spend at this user count
- Zero cross-firm data incidents
- Zero state-regulator complaints

## 15. Open questions (to resolve before writing-plans)

None. All four gates answered:
- Q1 map: OSM subtle, free
- Q2 pricing: flat SaaS $79/$199/$499, card-capture
- Q3 states: 14 (13 green + OH + FL enforced)
- Q4 DB: Supabase
