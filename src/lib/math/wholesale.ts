import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface WholesaleResultV2 {
  mao: number;
  spread: number;
  assignmentFeeUsed: number;
  equityToBuyer: number;
  meetsThresholds: boolean;
}

export function computeWholesale(
  i: MathInputs,
  _s: SharedDerived,
): WholesaleResultV2 {
  const assignmentFeeUsed = Math.max(
    i.targetAssignmentFee,
    Math.max(5_000, i.arv * 0.02),
  );
  const mao = i.arv * 0.7 - i.rehabCost - assignmentFeeUsed;
  const spread = mao - i.purchasePrice;
  const equityToBuyer = i.arv - mao - i.rehabCost;
  return {
    mao,
    spread,
    assignmentFeeUsed,
    equityToBuyer,
    meetsThresholds: spread >= 0,
  };
}
