import { estimateRepairs } from "./repair";
import { computeFlip, computeHold, computeWholesale } from "./strategies";
import { decide } from "./decision";
import { runEngine, type MathInputs } from "@/lib/math";
import type { StateCode } from "@/lib/compliance/types";
import type { AnalysisInput, AnalysisResult, RepairEstimate } from "./types";

export const ENGINE_VERSION = "0.1.0";

function inputsToMath(
  input: AnalysisInput,
  repair: RepairEstimate,
): MathInputs {
  return {
    arv: input.arvCents / 100,
    purchasePrice: input.askingPriceCents / 100,
    rehabCost: repair.midCents / 100,
    downPct: 0.2,
    interestRate: 0.075,
    loanTermYears: 30,
    holdingMonths: 6,
    closingBuyPct: 0.02,
    closingSellPct: input.flipSellingCostPct ?? 0.08,
    propertyTaxAnnual: 0,
    insuranceAnnual: 1_500,
    hoaMonthly: 0,
    utilitiesMonthly: 150,
    marketRentMonthly: (input.estimatedRentCents ?? 0) / 100,
    vacancyPct: 0.08,
    mgmtPct: 0.08,
    maintenancePct: 0.05,
    capexPct: 0.05,
    targetAssignmentFee: (input.assignmentFeeCents ?? 1_000_000) / 100,
    state: ((input.state || null) as StateCode | null) ?? null,
  };
}

export function analyzeDeal(input: AnalysisInput): AnalysisResult {
  const repair = estimateRepairs(input);

  const wholesale =
    input.strategy === "wholesale"
      ? computeWholesale(input, repair)
      : undefined;
  const flip = input.strategy === "flip" ? computeFlip(input, repair) : undefined;
  const hold = input.strategy === "hold" ? computeHold(input, repair) : undefined;

  const { decision, reasons, flags } = decide({
    input,
    repair,
    wholesale,
    flip,
    hold,
  });

  let mathV2;
  try {
    mathV2 = runEngine(inputsToMath(input, repair));
  } catch {
    mathV2 = undefined;
  }

  return {
    strategy: input.strategy,
    repair,
    wholesale,
    flip,
    hold,
    decision,
    reasons,
    flags,
    engineVersion: ENGINE_VERSION,
    computedAt: new Date().toISOString(),
    mathV2,
  };
}

// Convenience: compute all three strategies for a property (used by comparison view)
export function analyzeAllStrategies(
  base: Omit<AnalysisInput, "strategy">,
): Record<"wholesale" | "flip" | "hold", AnalysisResult> {
  return {
    wholesale: analyzeDeal({ ...base, strategy: "wholesale" }),
    flip: analyzeDeal({ ...base, strategy: "flip" }),
    hold: analyzeDeal({ ...base, strategy: "hold" }),
  };
}

export type {
  AnalysisInput,
  AnalysisResult,
  DecisionScore,
  Flag,
  RepairEstimate,
  Strategy,
} from "./types";
