export type Strategy = "wholesale" | "flip" | "hold";
export type RepairTier = "low" | "medium" | "high";
export type DecisionScore = "pursue" | "review" | "pass";

export interface AnalysisInput {
  strategy: Strategy;
  state: string;

  // Property
  sqft: number;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
  conditionRating: 1 | 2 | 3 | 4 | 5;
  occupancy: "vacant" | "owner" | "tenant";

  // Money (all in cents)
  askingPriceCents: number;
  arvCents: number;
  estimatedRentCents?: number;
  assignmentFeeCents?: number;

  // Qualitative
  repairNotes?: string;
  sellerMotivation: 1 | 2 | 3 | 4 | 5;
  timelineUrgencyDays?: number;

  // Optional overrides
  maoMultiplier?: number; // default 0.70
  flipHoldingCostPct?: number; // default 0.06
  flipSellingCostPct?: number; // default 0.08
}

export interface RepairEstimate {
  tier: RepairTier;
  lowCents: number;
  highCents: number;
  midCents: number;
  keywordHits: string[];
}

export interface WholesaleResult {
  maoCents: number;
  profitSpreadCents: number; // mao - asking (positive = room)
  meetsThresholds: boolean;
  multiplierUsed: number;
}

export interface FlipResult {
  purchaseAssumedCents: number;
  holdingCostCents: number;
  sellingCostCents: number;
  netProfitCents: number;
  netMarginPct: number;
  meetsThresholds: boolean;
}

export interface HoldResult {
  monthlyRentCents: number;
  noiAnnualCents: number;
  monthlyCashFlowCents: number;
  capRatePct: number;
  cashOnCashPct: number;
  meetsThresholds: boolean;
}

export interface Flag {
  code: string;
  severity: "hard" | "soft";
  message: string;
}

export interface AnalysisResult {
  strategy: Strategy;
  repair: RepairEstimate;
  wholesale?: WholesaleResult;
  flip?: FlipResult;
  hold?: HoldResult;
  decision: DecisionScore;
  reasons: string[];
  flags: Flag[];
  engineVersion: string;
  computedAt: string;
}
