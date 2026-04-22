import type { AnalysisInput } from "@/lib/analysis/types";
import type { DealDraft } from "./types";

export function draftToInput(draft: DealDraft): AnalysisInput | null {
  if (
    !draft.strategy ||
    !draft.state ||
    !draft.sqft ||
    draft.askingPriceCents == null ||
    draft.arvCents == null ||
    !draft.conditionRating ||
    !draft.occupancy ||
    !draft.sellerMotivation
  ) {
    return null;
  }

  return {
    strategy: draft.strategy,
    state: draft.state,
    sqft: draft.sqft,
    beds: draft.beds,
    baths: draft.baths,
    yearBuilt: draft.yearBuilt,
    conditionRating: draft.conditionRating,
    occupancy: draft.occupancy,
    askingPriceCents: draft.askingPriceCents,
    arvCents: draft.arvCents,
    estimatedRentCents: draft.estimatedRentCents,
    assignmentFeeCents: draft.assignmentFeeCents,
    repairNotes: draft.repairNotes,
    sellerMotivation: draft.sellerMotivation,
    timelineUrgencyDays: draft.timelineUrgencyDays,
  };
}

export function validateStep(
  step: "strategy" | "state" | "property" | "remarks" | "analyze" | "review",
  draft: DealDraft,
): string | null {
  switch (step) {
    case "strategy":
      return draft.strategy ? null : "Pick a strategy to continue.";
    case "state":
      return draft.state ? null : "Pick the state where the property sits.";
    case "property":
      if (!draft.propertyAddress) return "Add a street address.";
      if (!draft.propertyCity || !draft.propertyZip)
        return "City and ZIP are required.";
      if (!draft.sqft) return "Square footage drives the repair estimate.";
      if (!draft.conditionRating) return "Rate the property condition.";
      if (!draft.occupancy) return "Who lives there?";
      if (draft.askingPriceCents == null)
        return "Asking price is required.";
      if (draft.arvCents == null) return "ARV is required.";
      return null;
    case "remarks":
      if (!draft.sellerMotivation) return "Gauge seller motivation.";
      return null;
    default:
      return null;
  }
}
