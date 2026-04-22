import { estimateRepairs } from "./repair";
import { computeFlip, computeHold, computeWholesale } from "./strategies";
import { decide } from "./decision";
import type { AnalysisInput, AnalysisResult } from "./types";

export const ENGINE_VERSION = "0.1.0";

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
