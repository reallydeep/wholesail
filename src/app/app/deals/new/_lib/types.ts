import type { StateCode } from "@/lib/compliance/types";
import type { Strategy } from "@/lib/analysis/types";

export type WizardStep =
  | "strategy"
  | "state"
  | "property"
  | "remarks"
  | "analyze"
  | "review";

export const STEP_ORDER: WizardStep[] = [
  "strategy",
  "state",
  "property",
  "remarks",
  "analyze",
  "review",
];

export const STEP_LABELS: Record<WizardStep, string> = {
  strategy: "Strategy",
  state: "State",
  property: "Property",
  remarks: "Remarks",
  analyze: "Analyze",
  review: "Review",
};

export interface DealDraft {
  // Step 1
  strategy?: Strategy;
  // Step 2
  state?: StateCode;
  // Step 3 — property
  propertyAddress?: string;
  propertyCity?: string;
  propertyZip?: string;
  propertyCounty?: string;
  sqft?: number;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
  conditionRating?: 1 | 2 | 3 | 4 | 5;
  occupancy?: "vacant" | "owner" | "tenant";
  askingPriceCents?: number;
  arvCents?: number;
  estimatedRentCents?: number;
  assignmentFeeCents?: number;
  // Step 4 — remarks / photos
  sellerMotivation?: 1 | 2 | 3 | 4 | 5;
  repairNotes?: string;
  timelineUrgencyDays?: number;
  photoCount?: number; // stub — photos aren't persisted yet
  // Buyer/seller (skeleton — used by templates)
  buyerName?: string;
  buyerEntity?: string;
  sellerName?: string;
}

export const STRATEGY_COPY: Record<Strategy, { label: string; sub: string; line: string }> = {
  wholesale: {
    label: "Wholesale",
    sub: "Assign the contract for a fee.",
    line: "MAO = ARV × 70% − repairs − fee",
  },
  flip: {
    label: "Fix & Flip",
    sub: "Buy, renovate, resell at ARV.",
    line: "Target ≥ 15% ARV net margin",
  },
  hold: {
    label: "Buy & Hold",
    sub: "Purchase, rent, cashflow.",
    line: "Target 8%+ cap, positive cashflow",
  },
};
