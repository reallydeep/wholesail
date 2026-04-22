export type StateCode =
  | "AL" | "CO" | "GA" | "KS" | "MI" | "MO" | "NC" | "SC"
  | "TN" | "TX" | "VA" | "WI" | "WV"
  | "OH" | "FL";
export type Strategy = "wholesale" | "flip" | "hold";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface StateRuleSet {
  stateCode: StateCode;
  stateName: string;
  effectiveFrom: string; // ISO date
  effectiveUntil?: string;
  confidence: ConfidenceLevel;

  // Assignment rules
  assignmentAllowed: boolean;
  assignmentDisclosureRequired: boolean;
  sellerConsentRequired: boolean;

  // Licensing
  wholesalerLicenseRequired: boolean;
  licenseThresholdDealsPerYear?: number;

  // Marketing
  marketingRestricted: boolean;

  // Timing
  cancelationRightDays?: number;
  closingMaxDays?: number;

  // Clauses required in PSA
  requiredClauses: string[]; // clause ids from template library

  // Attorney
  attorneyReviewRequired: boolean; // hard block until acknowledged
  attorneyAtCloseCustomary: boolean; // strong advice shown in UI

  // Banners + notes
  bannerMessage?: string;
  notes: string;
  sourceRefs: { label: string; url?: string }[];
}

export interface ComplianceDecision {
  state: StateCode;
  strategy: Strategy;
  ruleSet: StateRuleSet;
  recommendedFlow: "direct-assignment" | "double-close" | "standard";
  warnings: ComplianceWarning[];
  attorneyFlagged: boolean;
  generatedAt: string;
}

export interface ComplianceWarning {
  severity: "info" | "warn" | "block";
  title: string;
  body: string;
}
