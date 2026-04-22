import type { StateRuleSet } from "../types";

export const FL_2026_Q1: StateRuleSet = {
  stateCode: "FL",
  stateName: "Florida",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: false, // allowed without explicit statutory disclosure, but we still include for safety
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: false,
  cancelationRightDays: undefined,
  closingMaxDays: undefined,
  requiredClauses: [
    "fl.principal-not-agent",
    "fl.ch-475-disclaimer",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: false, // title company standard
  bannerMessage:
    "Florida is investor-friendly. Assignment is permitted without statutory restriction. Close via title company or attorney.",
  notes:
    "Florida is among the most assignment-friendly states. Chapter 475 (real estate professionals) does not prohibit principal-buyer wholesaling. We still include a principal-not-agent clause to remove ambiguity.",
  sourceRefs: [
    { label: "Chapter 475, Florida Statutes (real estate professionals)" },
    { label: "Florida Real Estate Commission (FREC)" },
  ],
};

export const ALL_FL: StateRuleSet[] = [FL_2026_Q1];
