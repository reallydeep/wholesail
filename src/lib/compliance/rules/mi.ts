import type { StateRuleSet } from "../types";

// Michigan has no wholesaler-specific statute. Wholesale assignment is
// permitted under MCL Chapter 565 (real-estate contracts) and MCL
// Chapter 339, Article 25 (Occupational Code — real-estate brokers/
// salespersons). LARA (Department of Licensing and Regulatory Affairs)
// has published guidance: marketing a property you do not own — as
// opposed to marketing your contract interest — can be construed as
// brokerage activity requiring a license.
export const MI_2026_Q1: StateRuleSet = {
  stateCode: "MI",
  stateName: "Michigan",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: false,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: true,
  requiredClauses: [
    "mi.principal-not-agent",
    "mi.equitable-interest-disclosure",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: false, // title-company close standard
  bannerMessage:
    "Michigan permits assignment of purchase contracts. Market only your contract interest — public listing of property you don't own can trigger Article 25 unlicensed-brokerage exposure (MCL § 339.2501).",
  notes:
    "Michigan Occupational Code Article 25 (MCL § 339.2501 et seq.) defines real-estate broker activity broadly. Wholesalers should treat their marketing copy as advertising the equitable interest under their purchase contract, not the underlying real property. Title-company closings are standard; attorneys are not required.",
  sourceRefs: [
    {
      label: "MCL § 339.2501 (Real-Estate Brokers — Article 25)",
      url: "http://www.legislature.mi.gov/(S(0))/mileg.aspx?page=GetObject&objectname=mcl-339-2501",
    },
    {
      label: "Michigan LARA — Real Estate Licensing",
      url: "https://www.michigan.gov/lara",
    },
  ],
};

export const ALL_MI: StateRuleSet[] = [MI_2026_Q1];
