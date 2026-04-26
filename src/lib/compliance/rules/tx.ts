import type { StateRuleSet } from "../types";

// Texas SB 2212 (2017, eff. 09/01/2017) — added Texas Occupations Code
// § 1101.0045: a person who engages in real estate brokerage by selling
// or offering to sell an option or assigning or offering to assign an
// interest in a contract for the sale of real property must either hold
// a real estate license OR disclose in writing to any potential buyer
// that the person is selling only an option or assignable interest, NOT
// the underlying real property.
export const TX_2026_Q1: StateRuleSet = {
  stateCode: "TX",
  stateName: "Texas",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: true,
  requiredClauses: [
    "tx.equitable-interest-disclosure",
    "tx.principal-not-agent",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: false, // title-company close is standard
  bannerMessage:
    "Texas requires written disclosure that you are assigning equitable interest, not the underlying real property. Marketing the property itself without that disclosure can constitute unlicensed brokerage under Tex. Occ. Code § 1101.0045.",
  notes:
    "Under Tex. Occ. Code § 1101.0045 (added by SB 2212, 2017) wholesalers must either hold a license or disclose in writing that they are assigning an option or assignable contract interest — not the real property. Treat all marketing copy and assignment paperwork as needing the equitable-interest disclosure. Close at a title company; attorney review only on distressed-seller deals.",
  sourceRefs: [
    {
      label: "Texas Occupations Code § 1101.0045 (equitable-interest disclosure)",
      url: "https://statutes.capitol.texas.gov/Docs/OC/htm/OC.1101.htm",
    },
    {
      label: "TREC Advertising Rule § 535.155",
      url: "https://www.trec.texas.gov/agency-information/rules-and-laws",
    },
  ],
};

export const ALL_TX: StateRuleSet[] = [TX_2026_Q1];
