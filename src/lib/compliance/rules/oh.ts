import type { StateRuleSet } from "../types";

export const OH_2026_Q1: StateRuleSet = {
  stateCode: "OH",
  stateName: "Ohio",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: false,
  cancelationRightDays: undefined,
  closingMaxDays: undefined,
  requiredClauses: [
    "oh.assignment-disclosure",
    "oh.principal-not-agent",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: true,
  bannerMessage:
    "Assignment is permitted in Ohio with clear disclosure of assignment intent. Work with an attorney on distressed-seller deals.",
  notes:
    "Ohio permits wholesale assignments. Disclose assignment intent in the PSA. Watch for distressed-seller dynamics; Ohio courts have scrutinized bad-faith wholesaling. Close with an attorney or title company review.",
  sourceRefs: [
    { label: "Ohio Division of Real Estate — Licensing Overview" },
    { label: "Ohio Revised Code Chapter 4735 (real estate brokers)" },
  ],
};

export const ALL_OH: StateRuleSet[] = [OH_2026_Q1];
