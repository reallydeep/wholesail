import type { StateRuleSet } from "../types";

export const PA_2026_Q1: StateRuleSet = {
  stateCode: "PA",
  stateName: "Pennsylvania",
  effectiveFrom: "2026-01-01",
  confidence: "medium",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: true, // best practice, not statutory
  wholesalerLicenseRequired: false,
  marketingRestricted: false,
  cancelationRightDays: undefined,
  closingMaxDays: undefined,
  requiredClauses: [
    "pa.assignment-disclosure",
    "pa.principal-not-agent",
    "pa.seller-acknowledgment",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: true,
  bannerMessage:
    "Pennsylvania traditionally closes with an attorney. Include assignment disclosure and seller acknowledgment; active regulatory discussion in 2025–2026.",
  notes:
    "PA permits wholesale with clear disclosure. Customary to close with an attorney (not title company alone). Monitor for pending legislation around wholesaler conduct; disclosure-forward approach is safest.",
  sourceRefs: [
    { label: "PA Real Estate Licensing and Registration Act (RELRA)" },
    { label: "PA State Real Estate Commission guidance" },
  ],
};

export const ALL_PA: StateRuleSet[] = [PA_2026_Q1];
