export interface AiAnalysisNarrative {
  headline: string;
  thesis: string;
  opportunities: string[];
  risks: string[];
  negotiation: string[];
  source: "ai" | "deterministic";
  generatedAt: string;
  inputHash: string;
}

export interface AiDocDraft {
  kind: "cover-letter" | "market-memo" | "seller-outreach" | "buyer-brief";
  title: string;
  body: string;
  source: "ai" | "deterministic";
  generatedAt: string;
  inputHash: string;
}

export type AiDocKind = AiDocDraft["kind"];

export interface DealSnapshotForAi {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  strategy?: "wholesale" | "flip" | "hold";
  askingPriceCents?: number;
  arvCents?: number;
  assignmentFeeCents?: number;
  estimatedRentCents?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
  conditionRating?: number;
  occupancy?: string;
  repairNotes?: string;
  sellerMotivation?: number;
  timelineUrgencyDays?: number;
  decision?: string;
  repairTier?: string;
  repairMidCents?: number;
  maoCents?: number;
  spreadCents?: number;
  netProfitCents?: number;
  netMarginPct?: number;
  capRatePct?: number;
  monthlyCashFlowCents?: number;
}
