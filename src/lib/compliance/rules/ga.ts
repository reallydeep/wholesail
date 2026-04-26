import type { StateRuleSet } from "../types";

// Georgia HB 1292 (eff. 2024) tightened wholesaling — non-licensee
// wholesalers cannot publicly market property they do not own; they may
// only market the contract/equitable interest. The Georgia Real Estate
// Commission has clarified that habitual wholesaling (5+ deals/year is
// the working threshold many practitioners cite) can be construed as
// unlicensed brokerage under O.C.G.A. § 43-40.
export const GA_2026_Q1: StateRuleSet = {
  stateCode: "GA",
  stateName: "Georgia",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  licenseThresholdDealsPerYear: 5,
  marketingRestricted: true,
  requiredClauses: [
    "ga.equitable-interest-disclosure",
    "ga.principal-not-agent",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: true, // GA requires attorney at closing
  attorneyAtCloseCustomary: true,
  bannerMessage:
    "Georgia is an attorney-close state. Closings must be conducted by a Georgia-licensed attorney. Only market your contract interest, not the property itself, unless licensed.",
  notes:
    "Georgia requires real-estate closings to be supervised by a licensed Georgia attorney (State Bar of Georgia, Formal Advisory Opinion 86-5). For wholesaling, market only the contract/equitable interest — public-facing 'for sale' marketing of property you don't own can trigger O.C.G.A. § 43-40 unlicensed-brokerage exposure. Volume-based scrutiny kicks in around 5 transactions/year.",
  sourceRefs: [
    {
      label: "O.C.G.A. § 43-40 (Real Estate Brokers and Salespersons)",
      url: "https://law.justia.com/codes/georgia/2022/title-43/chapter-40/",
    },
    {
      label: "State Bar of Georgia Formal Advisory Opinion 86-5 (closings)",
      url: "https://www.gabar.org/",
    },
    { label: "Georgia Real Estate Commission" },
  ],
};

export const ALL_GA: StateRuleSet[] = [GA_2026_Q1];
