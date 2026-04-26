import type { StateRuleSet } from "../types";

// Tennessee Public Chapter 957 (SB 1768 / HB 1632, eff. 07/01/2024)
// amended TCA § 62-13-104 to require any person engaged in wholesaling
// real estate to disclose in writing to the property owner that they
// (a) intend to assign the contract and (b) are NOT licensed as a real
// estate broker (if they are not). It also restricts marketing the
// property to a third party without the seller's written consent.
export const TN_2026_Q1: StateRuleSet = {
  stateCode: "TN",
  stateName: "Tennessee",
  effectiveFrom: "2026-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: true,
  sellerConsentRequired: true, // marketing/assignment-to-third-party requires written seller consent
  wholesalerLicenseRequired: false,
  marketingRestricted: true,
  requiredClauses: [
    "tn.seller-consent-to-assign",
    "tn.unlicensed-status-disclosure",
    "tn.principal-not-agent",
    "standard.as-is",
    "standard.attorney-review",
  ],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: false, // title companies handle most closings
  bannerMessage:
    "Tennessee Public Chapter 957 (eff. 07/01/2024) requires written disclosure to the seller that you intend to assign and (if applicable) are unlicensed. Marketing the property to a third party without written seller consent is prohibited.",
  notes:
    "Tenn. Code Ann. § 62-13-104 was amended in 2024 to add explicit wholesaler obligations: written disclosure of assignment intent, written disclosure of unlicensed status, and prior written seller consent before marketing the property to potential assignees. Penalties include unlicensed-brokerage exposure under TREC.",
  sourceRefs: [
    {
      label: "Tenn. Public Chapter 957 (2024) — wholesaler disclosure",
      url: "https://www.capitol.tn.gov/Bills/113/Bill/SB1768.pdf",
    },
    {
      label: "Tennessee Real Estate Commission (TREC)",
      url: "https://www.tn.gov/commerce/regboards/trec.html",
    },
  ],
};

export const ALL_TN: StateRuleSet[] = [TN_2026_Q1];
