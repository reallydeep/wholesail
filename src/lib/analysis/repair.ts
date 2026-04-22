import type { AnalysisInput, RepairEstimate, RepairTier } from "./types";

// Per-sqft bands in cents
const BANDS: Record<RepairTier, { low: number; high: number }> = {
  low: { low: 1000, high: 2000 },
  medium: { low: 2500, high: 4500 },
  high: { low: 5500, high: 9500 },
};

const BUMP_UP_KEYWORDS = [
  "foundation", "fndn",
  "roof", "reroof",
  "mold", "mildew",
  "fire", "smoke damage",
  "structural",
  "hvac", "furnace",
  "sewer", "plumbing",
  "electrical panel", "knob and tube",
  "water damage",
  "asbestos", "lead paint",
  "termite",
];

const BUMP_DOWN_KEYWORDS = [
  "cosmetic only",
  "paint only",
  "carpet only",
  "move-in ready",
  "turnkey",
  "rent-ready",
];

function baseTierFromCondition(c: AnalysisInput["conditionRating"]): RepairTier {
  if (c >= 4) return "low";
  if (c === 3) return "medium";
  return "high";
}

export function estimateRepairs(input: AnalysisInput): RepairEstimate {
  const notes = (input.repairNotes ?? "").toLowerCase();
  const hits: string[] = [];
  let tier = baseTierFromCondition(input.conditionRating);

  for (const kw of BUMP_UP_KEYWORDS) {
    if (notes.includes(kw)) {
      hits.push(kw);
    }
  }
  for (const kw of BUMP_DOWN_KEYWORDS) {
    if (notes.includes(kw)) {
      hits.push(kw);
    }
  }

  // Bump tier based on keyword density
  const bumpUp = BUMP_UP_KEYWORDS.filter((kw) => notes.includes(kw)).length;
  const bumpDown = BUMP_DOWN_KEYWORDS.filter((kw) => notes.includes(kw)).length;

  if (bumpUp >= 2 && tier === "low") tier = "medium";
  if (bumpUp >= 1 && tier === "medium") tier = "high";
  if (bumpUp >= 3) tier = "high";

  if (bumpDown >= 1 && tier === "high") tier = "medium";
  if (bumpDown >= 2 && tier === "medium") tier = "low";

  const band = BANDS[tier];
  const lowCents = band.low * input.sqft;
  const highCents = band.high * input.sqft;
  const midCents = Math.round((lowCents + highCents) / 2);

  return {
    tier,
    lowCents,
    highCents,
    midCents,
    keywordHits: hits,
  };
}
