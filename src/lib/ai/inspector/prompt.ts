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
