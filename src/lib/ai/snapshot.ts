import type { AnalysisResult } from "@/lib/analysis/types";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";
import type { DealSnapshotForAi } from "./types";

export function buildSnapshot(
  draft: DealDraft,
  analysis?: AnalysisResult,
): DealSnapshotForAi {
  return {
    address: draft.propertyAddress,
    city: draft.propertyCity,
    state: draft.state,
    zip: draft.propertyZip,
    strategy: draft.strategy,
    askingPriceCents: draft.askingPriceCents,
    arvCents: draft.arvCents,
    assignmentFeeCents: draft.assignmentFeeCents,
    estimatedRentCents: draft.estimatedRentCents,
    sqft: draft.sqft,
    beds: draft.beds,
    baths: draft.baths,
    yearBuilt: draft.yearBuilt,
    conditionRating: draft.conditionRating,
    occupancy: draft.occupancy,
    repairNotes: draft.repairNotes,
    sellerMotivation: draft.sellerMotivation,
    timelineUrgencyDays: draft.timelineUrgencyDays,
    decision: analysis?.decision,
    repairTier: analysis?.repair.tier,
    repairMidCents: analysis?.repair.midCents,
    maoCents: analysis?.wholesale?.maoCents,
    spreadCents: analysis?.wholesale?.profitSpreadCents,
    netProfitCents: analysis?.flip?.netProfitCents,
    netMarginPct: analysis?.flip?.netMarginPct,
    capRatePct: analysis?.hold?.capRatePct,
    monthlyCashFlowCents: analysis?.hold?.monthlyCashFlowCents,
  };
}
