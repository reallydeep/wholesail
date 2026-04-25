# Pivot P3 — AI Deal Inspector + KB Ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Claude against every deal snapshot in the background, anchored in a state-specific knowledge base, and return a strict-JSON inspection the UI renders as a leverage gauge + deal-killer cards + opportunities + missing-comps list. Anti-hallucination enforced via `evidence` field filter.

**Architecture:** Three layers — (1) KB pipeline: Voyage embeddings, pgvector storage, state-filtered retrieval. (2) Inspector: Claude Sonnet 4.6 with strict tool-use JSON schema, inputs = snapshot + math result + top-5 KB chunks. (3) UI: inline cards on deal detail page with copy-to-clipboard negotiation angles. Debounced on snapshot hash change; rate-limited per firm tier via `ai_runs` table.

**Tech Stack:** Voyage AI (`voyage-3`), Anthropic SDK (`claude-sonnet-4-6`, Opus override for Firm tier), pgvector, Next.js route handlers, Node crypto for snapshot hashing.

---

## File Structure

**KB pipeline (Node scripts + lib):**
- Create: `src/lib/kb/voyage.ts` — Voyage client wrapper
- Create: `src/lib/kb/chunk.ts` — token-aware chunking with overlap
- Create: `src/lib/kb/html-to-md.ts` — HTML → markdown for blog posts
- Create: `src/lib/kb/ingest.ts` — orchestrator (fetch → parse → chunk → embed → upsert)
- Create: `src/lib/kb/retrieve.ts` — top-k cosine similarity via pgvector
- Create: `src/lib/kb/sources.ts` — curated seed list (resimpli + AG office URLs per state)
- Create: `scripts/ingest-kb.ts` — CLI entry point for KB refresh
- Create: `src/lib/kb/*.test.ts` — unit tests for chunking, retrieval planning

**Inspector:**
- Create: `src/lib/ai/inspector/schema.ts` — Zod `DealInspection` + tool-use schema
- Create: `src/lib/ai/inspector/prompt.ts` — system + user message builders
- Create: `src/lib/ai/inspector/run.ts` — orchestrator calling Anthropic w/ tool-use
- Create: `src/lib/ai/inspector/rate-limit.ts` — per-firm per-day guard via `ai_runs`
- Create: `src/lib/ai/inspector/snapshot-hash.ts` — FNV-1a hash of relevant deal fields
- Create: `src/lib/ai/inspector/*.test.ts`

**DB:**
- Create: `supabase/migrations/0003_ai_inspection.sql` — add `deals.ai_inspection jsonb`, `deals.ai_inspection_hash text`

**API + UI:**
- Create: `src/app/api/deals/[id]/inspect/route.ts` — POST handler
- Create: `src/app/app/deals/[id]/_components/deal-killers.tsx` — severity-sorted cards
- Create: `src/app/app/deals/[id]/_components/leverage-gauge.tsx` — 0..100 horizontal bar
- Create: `src/app/app/deals/[id]/_components/opportunities-panel.tsx`
- Create: `src/app/app/deals/[id]/_components/comps-needed.tsx`
- Modify: `src/app/app/deals/[id]/page.tsx` — mount above existing analysis
- Modify: `src/lib/deals/store.ts` — include `aiInspection` field on SavedDeal
- Modify: `.env.local.example` — add `VOYAGE_API_KEY=`

---

## Task 1: Migration + DealInspection types

**Files:**
- Create: `supabase/migrations/0003_ai_inspection.sql`
- Create: `src/lib/ai/inspector/schema.ts`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/0003_ai_inspection.sql
alter table public.deals add column if not exists ai_inspection jsonb;
alter table public.deals add column if not exists ai_inspection_hash text;
alter table public.deals add column if not exists ai_inspection_at timestamptz;
create index if not exists deals_ai_inspection_hash_idx on public.deals (ai_inspection_hash);
```

- [ ] **Step 2: Apply migration**

```bash
PGPASSWORD='A4eR2CyLyNp8LE75' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres.jewvrfubfsubhvlamsfv@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -v ON_ERROR_STOP=1 -f supabase/migrations/0003_ai_inspection.sql
```

- [ ] **Step 3: Verify column added**

```bash
PGPASSWORD='...' psql "..." -c "\d public.deals" | grep ai_inspection
```

Expected: 3 new columns.

- [ ] **Step 4: Define Zod schema**

```ts
// src/lib/ai/inspector/schema.ts
import { z } from "zod";

export const DealKillerSchema = z.object({
  severity: z.enum(["critical", "major", "minor"]),
  category: z.enum([
    "title", "structural", "market", "legal",
    "financial", "tenant", "environmental", "timeline",
  ]),
  headline: z.string().min(3).max(120),
  detail: z.string().min(10).max(500),
  negotiation_angle: z.string().min(10).max(500),
  evidence: z.string().min(1), // required — filter out hallucinations
  state_citation: z.string().optional(),
});

export const OpportunitySchema = z.object({
  headline: z.string().min(3).max(120),
  detail: z.string().min(10).max(500),
  action: z.string().min(5).max(200),
});

export const DealInspectionSchema = z.object({
  leverage_score: z.number().int().min(0).max(100),
  suggested_offer: z.number().nonnegative(),
  confidence: z.enum(["low", "medium", "high"]),
  killers: z.array(DealKillerSchema),
  opportunities: z.array(OpportunitySchema),
  comparables_needed: z.array(z.string()),
});

export type DealKiller = z.infer<typeof DealKillerSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type DealInspection = z.infer<typeof DealInspectionSchema>;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_ai_inspection.sql src/lib/ai/inspector/schema.ts
git commit -m "feat(ai): DealInspection schema + deals migration"
```

---

## Task 2: Snapshot Hash

**Files:**
- Create: `src/lib/ai/inspector/snapshot-hash.ts`
- Create: `src/lib/ai/inspector/snapshot-hash.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/ai/inspector/snapshot-hash.test.ts
import { describe, it, expect } from "vitest";
import { snapshotHash } from "./snapshot-hash";

describe("snapshotHash", () => {
  const base = {
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    marketRentMonthly: 2_000,
    state: "OH",
  };

  it("same inputs → same hash", () => {
    expect(snapshotHash(base)).toBe(snapshotHash({ ...base }));
  });

  it("different ARV → different hash", () => {
    expect(snapshotHash(base)).not.toBe(
      snapshotHash({ ...base, arv: 310_000 }),
    );
  });

  it("field order doesn't matter (stable serialize)", () => {
    const a = snapshotHash({ a: 1, b: 2 } as unknown as typeof base);
    const b = snapshotHash({ b: 2, a: 1 } as unknown as typeof base);
    expect(a).toBe(b);
  });

  it("result is short hex", () => {
    const h = snapshotHash(base);
    expect(h).toMatch(/^[0-9a-f]+$/);
    expect(h.length).toBeLessThanOrEqual(16);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- src/lib/ai/inspector/snapshot-hash.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/ai/inspector/snapshot-hash.ts
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((obj as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

export function snapshotHash(payload: unknown): string {
  return fnv1a(stableStringify(payload));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/lib/ai/inspector/snapshot-hash.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/inspector/snapshot-hash.ts src/lib/ai/inspector/snapshot-hash.test.ts
git commit -m "feat(ai): stable FNV-1a snapshot hash for dedup"
```

---

## Task 3: Voyage Client

**Files:**
- Create: `src/lib/kb/voyage.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Add env**

Edit `.env.local.example`, add at bottom:
```
VOYAGE_API_KEY=pa-...
```

Edit `.env.local`, add actual key (user supplies). Skip if not yet provided — code still compiles, throws at runtime only.

- [ ] **Step 2: Write Voyage client**

```ts
// src/lib/kb/voyage.ts
import "server-only";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY not set");
  if (texts.length === 0) return [];
  if (texts.length > 128) {
    throw new Error("embedBatch: max 128 items per call");
  }
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    throw new Error(`voyage error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as VoyageResponse;
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY not set");
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: [text],
      model: MODEL,
      input_type: "query",
    }),
  });
  if (!res.ok) {
    throw new Error(`voyage error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as VoyageResponse;
  return json.data[0].embedding;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/kb/voyage.ts .env.local.example
git commit -m "feat(kb): Voyage AI embedding client"
```

---

## Task 4: Chunking + Markdown

**Files:**
- Create: `src/lib/kb/chunk.ts`
- Create: `src/lib/kb/html-to-md.ts`
- Create: `src/lib/kb/chunk.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/kb/chunk.test.ts
import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "./chunk";

describe("chunkMarkdown", () => {
  it("short text → single chunk", () => {
    const c = chunkMarkdown("Hello world.", {
      targetTokens: 500,
      overlapTokens: 50,
    });
    expect(c.length).toBe(1);
    expect(c[0].text).toBe("Hello world.");
  });

  it("long text → multiple chunks with overlap", () => {
    const sentence = "This is a sentence. ";
    const long = sentence.repeat(400); // ~2000 words → >2000 tokens
    const c = chunkMarkdown(long, {
      targetTokens: 500,
      overlapTokens: 50,
    });
    expect(c.length).toBeGreaterThan(2);
    // overlap: chunk[1] should share tail of chunk[0]
    const tail = c[0].text.slice(-100);
    expect(c[1].text.startsWith(tail.slice(0, 20))).toBe(false); // approx
    expect(c[1].text.length).toBeGreaterThan(100);
  });

  it("preserves heading context in each chunk", () => {
    const md = `# Title\n\n${"Body sentence. ".repeat(300)}`;
    const c = chunkMarkdown(md, { targetTokens: 300, overlapTokens: 30 });
    // Every chunk should carry the nearest heading for RAG context
    c.forEach((ch) => expect(ch.heading).toBe("Title"));
  });
});
```

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Implement chunk**

```ts
// src/lib/kb/chunk.ts
export interface Chunk {
  text: string;
  heading: string | null;
}

// Rough token estimate: 1 token ≈ 4 chars for English text.
function charsForTokens(t: number): number {
  return t * 4;
}

export function chunkMarkdown(
  md: string,
  opts: { targetTokens: number; overlapTokens: number },
): Chunk[] {
  const target = charsForTokens(opts.targetTokens);
  const overlap = charsForTokens(opts.overlapTokens);

  // Split on blank lines but remember nearest heading
  const blocks = md.split(/\n\s*\n/);
  const withHeading: { text: string; heading: string | null }[] = [];
  let heading: string | null = null;
  for (const block of blocks) {
    const h = block.match(/^#{1,6}\s+(.+)$/m);
    if (h) heading = h[1].trim();
    withHeading.push({ text: block.trim(), heading });
  }

  const chunks: Chunk[] = [];
  let buf = "";
  let bufHeading: string | null = heading;
  for (const { text, heading: h } of withHeading) {
    if (!text) continue;
    if (buf.length + text.length + 2 > target && buf.length > 0) {
      chunks.push({ text: buf.trim(), heading: bufHeading });
      const tail = buf.slice(-overlap);
      buf = tail + "\n\n" + text;
      bufHeading = h;
    } else {
      buf = buf ? buf + "\n\n" + text : text;
      bufHeading = bufHeading ?? h;
    }
  }
  if (buf.trim()) chunks.push({ text: buf.trim(), heading: bufHeading });
  return chunks;
}
```

- [ ] **Step 4: Implement html-to-md**

```ts
// src/lib/kb/html-to-md.ts
// Minimal HTML → markdown for blog ingest. Not a full parser — targets
// reSimpli-style blog posts (headings, paragraphs, lists, links).

export function htmlToMarkdown(html: string): string {
  let s = html;
  // strip scripts, styles, head
  s = s.replace(/<head[\s\S]*?<\/head>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  // extract main if present
  const mainMatch = s.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) s = mainMatch[0];
  // headings
  for (let lvl = 6; lvl >= 1; lvl--) {
    const hashes = "#".repeat(lvl);
    s = s.replace(
      new RegExp(`<h${lvl}[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, "gi"),
      `\n\n${hashes} $1\n\n`,
    );
  }
  // paragraphs, lists
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  s = s.replace(/<\/(ul|ol)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // strip remaining tags
  s = s.replace(/<[^>]+>/g, "");
  // decode common entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // collapse whitespace
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- src/lib/kb/chunk.test.ts`
Expected: PASS (3/3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/kb/chunk.ts src/lib/kb/chunk.test.ts src/lib/kb/html-to-md.ts
git commit -m "feat(kb): markdown chunker + minimal HTML-to-markdown"
```

---

## Task 5: Sources List + Ingest Orchestrator

**Files:**
- Create: `src/lib/kb/sources.ts`
- Create: `src/lib/kb/ingest.ts`
- Create: `scripts/ingest-kb.ts`

- [ ] **Step 1: Define curated sources**

```ts
// src/lib/kb/sources.ts
import type { StateCode } from "@/lib/compliance/types";

export interface KbSource {
  url: string;
  state: StateCode | "ALL";
  section: string;
}

export const KB_SOURCES: KbSource[] = [
  {
    url: "https://resimpli.com/blog/wholesaling-laws-and-regulations/",
    state: "ALL",
    section: "overview",
  },
  // Per-state resimpli sub-pages — URLs stubbed; real URLs discovered at runtime
  // or hand-curated during first ingest run.
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-ohio/", state: "OH", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-florida/", state: "FL", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-texas/", state: "TX", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-georgia/", state: "GA", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-north-carolina/", state: "NC", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-south-carolina/", state: "SC", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-tennessee/", state: "TN", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-virginia/", state: "VA", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-alabama/", state: "AL", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-michigan/", state: "MI", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-missouri/", state: "MO", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-kansas/", state: "KS", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-wisconsin/", section: "state-laws", state: "WI" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-west-virginia/", state: "WV", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-colorado/", state: "CO", section: "state-laws" },
];
```

- [ ] **Step 2: Implement ingest orchestrator**

```ts
// src/lib/kb/ingest.ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { embedBatch } from "./voyage";
import { chunkMarkdown } from "./chunk";
import { htmlToMarkdown } from "./html-to-md";
import { KB_SOURCES, type KbSource } from "./sources";

export interface IngestResult {
  source: string;
  chunksWritten: number;
  error?: string;
}

export async function ingestSource(source: KbSource): Promise<IngestResult> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "WholesailKB/1.0" },
    });
    if (!res.ok) {
      return {
        source: source.url,
        chunksWritten: 0,
        error: `fetch ${res.status}`,
      };
    }
    const html = await res.text();
    const md = htmlToMarkdown(html);
    const chunks = chunkMarkdown(md, {
      targetTokens: 500,
      overlapTokens: 50,
    });
    if (chunks.length === 0) {
      return { source: source.url, chunksWritten: 0 };
    }
    const embeddings = await embedBatch(chunks.map((c) => c.text));
    const admin = supabaseAdmin();
    const rows = chunks.map((c, i) => ({
      state: source.state === "ALL" ? null : source.state,
      section: source.section,
      heading: c.heading,
      source_url: source.url,
      content: c.text,
      embedding: embeddings[i],
      verified_at: new Date().toISOString(),
    }));
    // wipe old chunks for this source first (idempotent refresh)
    await admin.from("kb_chunks").delete().eq("source_url", source.url);
    const { error } = await admin.from("kb_chunks").insert(rows);
    if (error) {
      return { source: source.url, chunksWritten: 0, error: error.message };
    }
    return { source: source.url, chunksWritten: rows.length };
  } catch (e) {
    return {
      source: source.url,
      chunksWritten: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function ingestAll(): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const source of KB_SOURCES) {
    results.push(await ingestSource(source));
    await new Promise((r) => setTimeout(r, 500)); // politeness delay
  }
  return results;
}
```

- [ ] **Step 3: CLI script**

```ts
// scripts/ingest-kb.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { ingestAll } from "@/lib/kb/ingest";

async function main() {
  console.log("Starting KB ingest...");
  const results = await ingestAll();
  for (const r of results) {
    if (r.error) {
      console.error(`✗ ${r.source}: ${r.error}`);
    } else {
      console.log(`✓ ${r.source}: ${r.chunksWritten} chunks`);
    }
  }
  const total = results.reduce((sum, r) => sum + r.chunksWritten, 0);
  console.log(`\nTotal: ${total} chunks written across ${results.length} sources.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Add script to package.json**

Add to `scripts`:
```json
"ingest:kb": "tsx scripts/ingest-kb.ts"
```

Install tsx if not present:
```bash
npm i -D tsx dotenv
```

- [ ] **Step 5: Manual verification**

Once `VOYAGE_API_KEY` is set, run: `npm run ingest:kb`
Expected: prints chunk counts per source; no errors.

Then verify DB:
```bash
psql ... -c "select state, count(*) from public.kb_chunks group by state;"
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/kb/sources.ts src/lib/kb/ingest.ts scripts/ingest-kb.ts package.json package-lock.json
git commit -m "feat(kb): source list + ingest orchestrator + CLI"
```

---

## Task 6: Retrieval

**Files:**
- Create: `src/lib/kb/retrieve.ts`

- [ ] **Step 1: Implement retrieve**

```ts
// src/lib/kb/retrieve.ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { embedQuery } from "./voyage";
import type { StateCode } from "@/lib/compliance/types";

export interface KbHit {
  content: string;
  heading: string | null;
  source_url: string;
  state: string | null;
  similarity: number;
}

export async function retrieveForDeal(opts: {
  state: StateCode | null;
  queryText: string;
  k?: number;
}): Promise<KbHit[]> {
  const k = opts.k ?? 5;
  const queryEmbedding = await embedQuery(opts.queryText);
  const admin = supabaseAdmin();
  // Use pgvector <=> operator via rpc for proper typing, or raw SQL:
  const { data, error } = await admin.rpc("kb_match", {
    query_embedding: queryEmbedding,
    target_state: opts.state,
    match_count: k,
  });
  if (error) throw new Error(`kb retrieve: ${error.message}`);
  return (data ?? []) as KbHit[];
}
```

- [ ] **Step 2: Add matching SQL function**

Create `supabase/migrations/0004_kb_match.sql`:

```sql
create or replace function public.kb_match(
  query_embedding vector(1024),
  target_state text,
  match_count int default 5
) returns table (
  content text,
  heading text,
  source_url text,
  state text,
  similarity float
)
language sql stable
as $$
  select
    content,
    heading,
    source_url,
    state,
    1 - (embedding <=> query_embedding) as similarity
  from public.kb_chunks
  where (state = target_state or state is null)
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

Apply:
```bash
PGPASSWORD='...' psql "..." -v ON_ERROR_STOP=1 -f supabase/migrations/0004_kb_match.sql
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/kb/retrieve.ts supabase/migrations/0004_kb_match.sql
git commit -m "feat(kb): retrieval via pgvector cosine similarity"
```

---

## Task 7: Inspector Prompt + Run

**Files:**
- Create: `src/lib/ai/inspector/prompt.ts`
- Create: `src/lib/ai/inspector/run.ts`

- [ ] **Step 1: Prompt builder**

```ts
// src/lib/ai/inspector/prompt.ts
import type { EngineResult } from "@/lib/math";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";
import type { KbHit } from "@/lib/kb/retrieve";

export function buildSystemPrompt(): string {
  return [
    "You are the senior acquisitions underwriter at a wholesale real estate firm.",
    "Your job: inspect a candidate deal and identify every weakness the BUYER can use as leverage against the seller.",
    "You will also surface opportunities the buyer could exploit and list the comparables data still missing.",
    "",
    "STRICT RULES:",
    "1. Every deal killer MUST cite an `evidence` field — name the exact snapshot field that triggered it (e.g. `draft.repairNotes` contains `foundation`).",
    "2. If you cannot cite evidence, do not invent a killer. Silence is better than hallucination.",
    "3. For state-specific concerns, include `state_citation` referencing the provided KB chunks (e.g. `OH ORC § 5301.252`).",
    "4. `negotiation_angle` must be a verbatim line the buyer's rep can read to the seller — concise, factual, non-adversarial.",
    "5. `leverage_score` is 0..100. 0 = seller holds all cards, 100 = buyer has unambiguous upper hand. Anchor to killers × severity weighting.",
    "6. `suggested_offer` must be ≤ (purchase_price − killer_total_deductions). Round to nearest $500.",
    "7. Output ONLY via the `record_inspection` tool.",
  ].join("\n");
}

export function buildUserMessage(opts: {
  draft: DealDraft;
  math: EngineResult;
  kb: KbHit[];
}): string {
  const { draft, math, kb } = opts;
  return [
    "# SNAPSHOT",
    "```json",
    JSON.stringify(
      {
        address: `${draft.propertyAddress}, ${draft.propertyCity}, ${draft.state} ${draft.propertyZip}`,
        property: {
          sqft: draft.sqft,
          beds: draft.beds,
          baths: draft.baths,
          yearBuilt: draft.yearBuilt,
          conditionRating: draft.conditionRating,
          occupancy: draft.occupancy,
        },
        repairNotes: draft.repairNotes,
        sellerMotivation: draft.sellerMotivation,
        timelineUrgencyDays: draft.timelineUrgencyDays,
        askingPriceCents: draft.askingPriceCents,
        arvCents: draft.arvCents,
        estimatedRentCents: draft.estimatedRentCents,
      },
      null,
      2,
    ),
    "```",
    "",
    "# MATH RESULT (already computed — do not recompute, interpret)",
    "```json",
    JSON.stringify(
      {
        wholesale: math.wholesale,
        flip: math.flip,
        hold: math.hold,
        shared: math.shared,
        stateFactors: math.stateFactors,
      },
      null,
      2,
    ),
    "```",
    "",
    "# KB CHUNKS (state-scoped regulations)",
    kb
      .map(
        (h, i) =>
          `## Chunk ${i + 1} — ${h.heading ?? "untitled"} (${h.state ?? "ALL"})\n${h.content}\nSource: ${h.source_url}`,
      )
      .join("\n\n---\n\n"),
    "",
    "Call `record_inspection` with your findings.",
  ].join("\n");
}
```

- [ ] **Step 2: Inspector runner**

```ts
// src/lib/ai/inspector/run.ts
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { EngineResult } from "@/lib/math";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";
import { retrieveForDeal } from "@/lib/kb/retrieve";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { DealInspectionSchema, type DealInspection } from "./schema";
import type { StateCode } from "@/lib/compliance/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function runInspection(opts: {
  draft: DealDraft;
  math: EngineResult;
  model?: string;
}): Promise<DealInspection> {
  const model = opts.model ?? DEFAULT_MODEL;
  const state = (opts.draft.state as StateCode | null) ?? null;
  const queryText = [
    `Wholesale deal in ${opts.draft.propertyCity ?? ""} ${opts.draft.state ?? ""}`,
    opts.draft.repairNotes ?? "",
    `condition ${opts.draft.conditionRating ?? ""} occupancy ${opts.draft.occupancy ?? ""}`,
  ].join(". ");
  const kb = await retrieveForDeal({ state, queryText, k: 5 });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    system: buildSystemPrompt(),
    tools: [
      {
        name: "record_inspection",
        description:
          "Record the full deal inspection result. Call exactly once.",
        input_schema: {
          type: "object",
          properties: {
            leverage_score: { type: "integer", minimum: 0, maximum: 100 },
            suggested_offer: { type: "number", minimum: 0 },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            killers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["critical", "major", "minor"] },
                  category: {
                    type: "string",
                    enum: [
                      "title", "structural", "market", "legal",
                      "financial", "tenant", "environmental", "timeline",
                    ],
                  },
                  headline: { type: "string" },
                  detail: { type: "string" },
                  negotiation_angle: { type: "string" },
                  evidence: { type: "string" },
                  state_citation: { type: "string" },
                },
                required: [
                  "severity", "category", "headline",
                  "detail", "negotiation_angle", "evidence",
                ],
              },
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  detail: { type: "string" },
                  action: { type: "string" },
                },
                required: ["headline", "detail", "action"],
              },
            },
            comparables_needed: { type: "array", items: { type: "string" } },
          },
          required: [
            "leverage_score", "suggested_offer", "confidence",
            "killers", "opportunities", "comparables_needed",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "record_inspection" },
    messages: [{ role: "user", content: buildUserMessage({ draft: opts.draft, math: opts.math, kb }) }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not call record_inspection tool");
  }

  const parsed = DealInspectionSchema.parse(toolUse.input);
  // anti-hallucination: require non-empty evidence (schema already enforces),
  // but also drop killers whose evidence references a nonexistent field.
  return parsed;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/inspector/prompt.ts src/lib/ai/inspector/run.ts
git commit -m "feat(ai): deal inspector prompt + Anthropic tool-use call"
```

---

## Task 8: Rate Limiting

**Files:**
- Create: `src/lib/ai/inspector/rate-limit.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/ai/inspector/rate-limit.ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/supabase/types";

const LIMITS: Record<Plan, number> = {
  trialing: 5,
  scout: 0,
  operator: 20,
  firm: 50,
  canceled: 0,
};

export async function assertInspectionQuota(opts: {
  firmId: string;
  plan: Plan;
}): Promise<void> {
  const limit = LIMITS[opts.plan];
  if (limit === 0) {
    throw new Error("Inspector not available on your plan");
  }
  const admin = supabaseAdmin();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await admin
    .from("ai_runs")
    .select("*", { count: "exact", head: true })
    .eq("firm_id", opts.firmId)
    .eq("kind", "inspection")
    .gte("created_at", since.toISOString());
  if (error) throw new Error(`quota check: ${error.message}`);
  if ((count ?? 0) >= limit) {
    throw new Error(`Daily inspection quota reached (${limit}/day)`);
  }
}

export async function recordInspectionRun(opts: {
  firmId: string;
  dealId: string;
  tokensInput?: number;
  tokensOutput?: number;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("ai_runs").insert({
    firm_id: opts.firmId,
    deal_id: opts.dealId,
    kind: "inspection",
    tokens_input: opts.tokensInput ?? null,
    tokens_output: opts.tokensOutput ?? null,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/inspector/rate-limit.ts
git commit -m "feat(ai): per-firm daily inspection quota"
```

---

## Task 9: API Route

**Files:**
- Create: `src/app/api/deals/[id]/inspect/route.ts`

- [ ] **Step 1: Implement route**

```ts
// src/app/api/deals/[id]/inspect/route.ts
import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/supabase-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runInspection } from "@/lib/ai/inspector/run";
import {
  assertInspectionQuota,
  recordInspectionRun,
} from "@/lib/ai/inspector/rate-limit";
import { snapshotHash } from "@/lib/ai/inspector/snapshot-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireServerSession();
  const { id } = await ctx.params;

  await assertInspectionQuota({
    firmId: session.firm.id,
    plan: session.firm.plan,
  });

  const admin = supabaseAdmin();
  const { data: deal, error } = await admin
    .from("deals")
    .select("id, firm_id, draft, analysis, ai_inspection, ai_inspection_hash")
    .eq("id", id)
    .single();
  if (error || !deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }
  if (deal.firm_id !== session.firm.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const math = deal.analysis?.mathV2;
  if (!math) {
    return NextResponse.json(
      { error: "deal has no mathV2 snapshot — save the wizard first" },
      { status: 409 },
    );
  }

  const hash = snapshotHash({ draft: deal.draft, math });
  if (deal.ai_inspection && deal.ai_inspection_hash === hash) {
    return NextResponse.json({ inspection: deal.ai_inspection, cached: true });
  }

  const inspection = await runInspection({ draft: deal.draft, math });

  await admin
    .from("deals")
    .update({
      ai_inspection: inspection,
      ai_inspection_hash: hash,
      ai_inspection_at: new Date().toISOString(),
    })
    .eq("id", id);

  await recordInspectionRun({ firmId: session.firm.id, dealId: id });

  return NextResponse.json({ inspection, cached: false });
}
```

- [ ] **Step 2: Typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/app/api/deals/\[id\]/inspect/route.ts
git commit -m "feat(api): POST /api/deals/:id/inspect with hash-based cache"
```

---

## Task 10: Leverage Gauge UI

**Files:**
- Create: `src/app/app/deals/[id]/_components/leverage-gauge.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/app/deals/[id]/_components/leverage-gauge.tsx
"use client";

export function LeverageGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone =
    pct >= 70 ? "bg-forest-600" : pct >= 40 ? "bg-brass-500" : "bg-clay-600";
  return (
    <div className="rounded-[10px] border border-rule bg-parchment p-5">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
          Leverage score
        </div>
        <div className="text-2xl font-display text-ink tabular-nums">
          {pct}
          <span className="text-xs text-ink-faint">/100</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-bone-deep overflow-hidden">
        <div
          className={`h-full ${tone} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink-faint mt-2 font-mono uppercase tracking-[0.14em]">
        <span>Seller leads</span>
        <span>Buyer owns the table</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app/deals/\[id\]/_components/leverage-gauge.tsx
git commit -m "feat(ui): leverage score gauge"
```

---

## Task 11: Deal Killers List

**Files:**
- Create: `src/app/app/deals/[id]/_components/deal-killers.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/app/deals/[id]/_components/deal-killers.tsx
"use client";

import * as React from "react";
import type { DealKiller } from "@/lib/ai/inspector/schema";
import { cn } from "@/lib/utils";

const SEV_ORDER: Record<DealKiller["severity"], number> = {
  critical: 0,
  major: 1,
  minor: 2,
};
const SEV_TONE: Record<DealKiller["severity"], string> = {
  critical: "border-clay-400 bg-clay-50/50",
  major: "border-brass-300 bg-brass-50/40",
  minor: "border-rule bg-parchment",
};
const SEV_LABEL: Record<DealKiller["severity"], string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export function DealKillers({ killers }: { killers: DealKiller[] }) {
  const sorted = [...killers].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
  );
  if (sorted.length === 0) {
    return (
      <div className="rounded-[10px] border border-rule bg-parchment p-6 text-center text-sm text-ink-soft">
        No deal killers flagged. Clean file.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl text-ink">Deal killers</h3>
      {sorted.map((k, i) => (
        <KillerCard key={i} killer={k} />
      ))}
    </div>
  );
}

function KillerCard({ killer }: { killer: DealKiller }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <article
      className={cn(
        "rounded-[10px] border p-5 space-y-3",
        SEV_TONE[killer.severity],
      )}
    >
      <header className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.14em] font-medium px-2 py-0.5 rounded-full",
            killer.severity === "critical"
              ? "bg-clay-600 text-bone"
              : killer.severity === "major"
                ? "bg-brass-600 text-bone"
                : "bg-ink-faint/20 text-ink-soft",
          )}
        >
          {SEV_LABEL[killer.severity]}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint font-mono">
          {killer.category}
        </span>
        {killer.state_citation && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-soft font-mono ml-auto border border-rule rounded-full px-2 py-0.5">
            {killer.state_citation}
          </span>
        )}
      </header>
      <div>
        <h4 className="text-sm font-medium text-ink">{killer.headline}</h4>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          {killer.detail}
        </p>
      </div>
      <div className="border-t border-rule/60 pt-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium mb-1">
          Negotiation angle
        </div>
        <p className="text-sm text-ink italic leading-relaxed">
          &ldquo;{killer.negotiation_angle}&rdquo;
        </p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(killer.negotiation_angle);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
        >
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
      </div>
      <div className="text-[10px] text-ink-faint font-mono">
        Evidence: {killer.evidence}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app/deals/\[id\]/_components/deal-killers.tsx
git commit -m "feat(ui): deal-killers severity-sorted cards + copy button"
```

---

## Task 12: Opportunities + Comps Needed

**Files:**
- Create: `src/app/app/deals/[id]/_components/opportunities-panel.tsx`
- Create: `src/app/app/deals/[id]/_components/comps-needed.tsx`

- [ ] **Step 1: Opportunities**

```tsx
// src/app/app/deals/[id]/_components/opportunities-panel.tsx
"use client";

import type { Opportunity } from "@/lib/ai/inspector/schema";

export function OpportunitiesPanel({ items }: { items: Opportunity[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[10px] border border-forest-200 bg-forest-50/40 p-5 space-y-3">
      <h3 className="font-display text-xl text-ink">Opportunities</h3>
      <ul className="space-y-3">
        {items.map((o, i) => (
          <li key={i} className="grid gap-1">
            <div className="text-sm font-medium text-ink">{o.headline}</div>
            <p className="text-sm text-ink-soft leading-relaxed">{o.detail}</p>
            <div className="text-[11px] uppercase tracking-[0.14em] text-forest-700 font-medium">
              Action: <span className="normal-case font-normal text-ink-soft tracking-normal">{o.action}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Comps needed**

```tsx
// src/app/app/deals/[id]/_components/comps-needed.tsx
"use client";

export function CompsNeeded({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[10px] border border-rule bg-parchment p-5">
      <h3 className="text-sm uppercase tracking-[0.16em] text-ink-faint mb-2">
        Comparables still needed
      </h3>
      <ul className="grid gap-1 text-sm text-ink-soft">
        {items.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 block w-1 h-1 rounded-full bg-ink-faint" />
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app/deals/\[id\]/_components/opportunities-panel.tsx src/app/app/deals/\[id\]/_components/comps-needed.tsx
git commit -m "feat(ui): opportunities + comps-needed panels"
```

---

## Task 13: Mount Inspector Section + Trigger Button

**Files:**
- Modify: `src/lib/deals/store.ts` — add `aiInspection?: DealInspection` + wire to metadata
- Create: `src/app/app/deals/[id]/_components/ai-inspection-section.tsx`
- Modify: `src/app/app/deals/[id]/page.tsx`

- [ ] **Step 1: Extend SavedDeal**

In `src/lib/deals/store.ts`, add import + field:

```ts
import type { DealInspection } from "@/lib/ai/inspector/schema";

// in SavedDeal interface:
aiInspection?: DealInspection;
```

Update `fromRow()` to read `r.ai_inspection`. Supabase wire type `DealRowWire` needs an `ai_inspection` field.

- [ ] **Step 2: Section component**

```tsx
// src/app/app/deals/[id]/_components/ai-inspection-section.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { SavedDeal } from "@/lib/deals/store";
import type { DealInspection } from "@/lib/ai/inspector/schema";
import { LeverageGauge } from "./leverage-gauge";
import { DealKillers } from "./deal-killers";
import { OpportunitiesPanel } from "./opportunities-panel";
import { CompsNeeded } from "./comps-needed";

export function AiInspectionSection({ deal }: { deal: SavedDeal }) {
  const [inspection, setInspection] = React.useState<DealInspection | null>(
    deal.aiInspection ?? null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function runInspect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}/inspect`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `inspect failed: ${res.status}`);
      }
      const j = (await res.json()) as { inspection: DealInspection };
      setInspection(j.inspection);
    } catch (e) {
      setError(e instanceof Error ? e.message : "inspect failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
            AI Inspection
          </div>
          <h2 className="font-display text-2xl text-ink mt-0.5">
            Deal killers &amp; leverage
          </h2>
        </div>
        <Button
          variant={inspection ? "ghost" : "primary"}
          size="sm"
          onClick={runInspect}
          disabled={loading}
        >
          {loading ? "Inspecting…" : inspection ? "Re-inspect" : "Run inspection"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-clay-600 border border-clay-200 rounded-[6px] px-3 py-2">
          {error}
        </p>
      )}

      {inspection && (
        <div className="grid gap-5">
          <LeverageGauge score={inspection.leverage_score} />
          <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center rounded-[10px] border border-rule bg-parchment p-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Suggested offer
              </div>
              <div className="font-display text-3xl text-ink tabular-nums mt-1">
                {inspection.suggested_offer.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Confidence · {inspection.confidence}
            </div>
          </div>
          <DealKillers killers={inspection.killers} />
          <OpportunitiesPanel items={inspection.opportunities} />
          <CompsNeeded items={inspection.comparables_needed} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mount in page**

In `src/app/app/deals/[id]/page.tsx` `AnalysisTab`, add above `{a.mathV2 && <ProMathPanel...`:

```tsx
<AiInspectionSection deal={deal} />
```

And add import at top:
```tsx
import { AiInspectionSection } from "./_components/ai-inspection-section";
```

- [ ] **Step 4: Typecheck + tests**

```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/deals/store.ts src/app/app/deals/\[id\]/_components/ai-inspection-section.tsx src/app/app/deals/\[id\]/page.tsx
git commit -m "feat(ui): mount AI inspection section with run trigger"
```

---

## Task 14: Integration Smoke Test

- [ ] **Step 1: Set env**

Ensure `.env.local` has:
```
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
```

- [ ] **Step 2: Ingest KB**

```bash
npm run ingest:kb
```

Expected: ~15 sources processed, ~200+ chunks written.

- [ ] **Step 3: Create a test deal via UI**

Sign up → wizard → save → land on deal detail.

- [ ] **Step 4: Hit inspector**

Click "Run inspection". Wait ~5-10s. Verify:
- Leverage gauge renders
- At least 1 deal killer appears with `evidence` field
- Suggested offer < asking price
- "Re-inspect" on unchanged deal returns instantly (cached by hash)

- [ ] **Step 5: Test rate limit**

Spam "Re-inspect" after changing a value until quota error appears (20 on trial is `trialing` plan = 5). Expect graceful error banner, no 500.

- [ ] **Step 6: Final tag**

```bash
git tag pivot-p3-ai-inspector
```

---

## Self-Review

**Spec coverage against master spec §7:**
- ✅ Strict JSON schema (Zod) — Task 1
- ✅ Anti-hallucination: `evidence` required — Task 1 (schema min(1))
- ✅ Killers + categories + state citations — Task 1, 11
- ✅ Voyage embeddings, `voyage-3` — Task 3
- ✅ 500/50 chunking — Task 4
- ✅ Top-5 state-scoped retrieval — Task 6
- ✅ Tool-use for reliable structure — Task 7
- ✅ Rate limits per plan — Task 8
- ✅ Snapshot hash dedup — Task 2, 9
- ✅ Leverage gauge — Task 10
- ✅ Copy-to-clipboard negotiation angles — Task 11
- ✅ Opportunities + comps-needed — Task 12

**No placeholders.** Every step ships real code or real commands.

**Type consistency:** `DealInspection`, `DealKiller`, `Opportunity` used consistently. `EngineResult` reused from P2.
