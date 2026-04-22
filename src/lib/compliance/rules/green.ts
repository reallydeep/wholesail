import type { StateCode, StateRuleSet } from "../types";

const GREEN_STATES: { code: StateCode; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "CO", name: "Colorado" },
  { code: "GA", name: "Georgia" },
  { code: "KS", name: "Kansas" },
  { code: "MI", name: "Michigan" },
  { code: "MO", name: "Missouri" },
  { code: "NC", name: "North Carolina" },
  { code: "SC", name: "South Carolina" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "VA", name: "Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WV", name: "West Virginia" },
];

const ATTORNEY_AT_CLOSE = new Set<StateCode>(["AL", "GA", "NC", "SC", "WV", "VA"]);

export const ALL_GREEN: StateRuleSet[] = GREEN_STATES.map(({ code, name }) => ({
  stateCode: code,
  stateName: name,
  effectiveFrom: "2024-01-01",
  confidence: "high",
  assignmentAllowed: true,
  assignmentDisclosureRequired: false,
  sellerConsentRequired: false,
  wholesalerLicenseRequired: false,
  marketingRestricted: false,
  requiredClauses: ["standard-psa", "assignment-clause", "as-is-clause"],
  attorneyReviewRequired: false,
  attorneyAtCloseCustomary: ATTORNEY_AT_CLOSE.has(code),
  notes: `${name} permits wholesale assignments without a broker license for non-habitual activity. Keep deal volume documented in case a regulator asks.`,
  sourceRefs: [
    { label: "Resimpli · Wholesaling Laws & Regulations", url: "https://resimpli.com/blog/wholesaling-laws-and-regulations/" },
  ],
}));
