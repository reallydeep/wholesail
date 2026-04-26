import type { StateRuleSet } from "../types";

// North Carolina is an attorney-state for real-estate closings. Under
// the State Bar's authorized-practice-of-law rules (RPC 38, Authorized
// Practice Advisory Opinion 2002-1), only NC-licensed attorneys may
// supervise residential closings. Wholesaling itself is permitted under
// the Real Estate License Act (NCGS § 93A) so long as marketing is
// limited to the equitable interest, not the property itself, and no
// brokerage compensation is collected without a license.
export const NC_2026_Q1: StateRuleSet = {
  stateCode: "NC",
  stateName: "North Carolina",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: true,
  requiredClauses: [
    "nc.equitable-interest-disclosure",
    "nc.principal-not-agent",
    "nc.attorney-supervised-closing",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: true, // NC requires attorney-supervised closing
  attorneyAtCloseCustomary: true,
  bannerMessage:
    "North Carolina requires an NC-licensed attorney to supervise residential closings (NC State Bar APAO 2002-1). Market your equitable contract interest only — public-facing marketing of property you don't own can trigger NCGS § 93A unlicensed-brokerage exposure.",
  notes:
    "NC State Bar Authorized Practice Advisory Opinion 2002-1 reserves residential closings to licensed attorneys. NCGS § 93A-1 governs real-estate brokerage and prohibits unlicensed parties from advertising or offering real property for sale on behalf of an owner; assigning equitable interest under your own contract is permitted. Build closing-attorney selection into the workflow.",
  sourceRefs: [
    {
      label: "NCGS § 93A (Real Estate License Act)",
      url: "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_93A.html",
    },
    {
      label: "NC State Bar Authorized Practice Advisory Opinion 2002-1",
      url: "https://www.ncbar.gov/for-lawyers/ethics/authorized-practice-of-law-opinions/",
    },
  ],
};

export const ALL_NC: StateRuleSet[] = [NC_2026_Q1];
