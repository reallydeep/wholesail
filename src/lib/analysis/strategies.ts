import type {
  AnalysisInput,
  FlipResult,
  HoldResult,
  RepairEstimate,
  WholesaleResult,
} from "./types";

/* ─── WHOLESALE ─────────────────────────────────────────────── */

export function computeWholesale(
  input: AnalysisInput,
  repair: RepairEstimate,
): WholesaleResult {
  const multiplier = input.maoMultiplier ?? 0.7;
  const fee = input.assignmentFeeCents ?? 0;
  const maoCents =
    Math.round(input.arvCents * multiplier) - repair.midCents - fee;

  const profitSpreadCents = maoCents - input.askingPriceCents;

  // Healthy if asking is at or below MAO (positive spread)
  const meetsThresholds = profitSpreadCents >= 0;

  return {
    maoCents,
    profitSpreadCents,
    meetsThresholds,
    multiplierUsed: multiplier,
  };
}

/* ─── FIX & FLIP ─────────────────────────────────────────────── */

export function computeFlip(
  input: AnalysisInput,
  repair: RepairEstimate,
): FlipResult {
  const holdingPct = input.flipHoldingCostPct ?? 0.06;
  const sellingPct = input.flipSellingCostPct ?? 0.08;

  const purchaseAssumedCents = input.askingPriceCents;
  const holdingCostCents = Math.round(input.arvCents * holdingPct);
  const sellingCostCents = Math.round(input.arvCents * sellingPct);

  const netProfitCents =
    input.arvCents -
    purchaseAssumedCents -
    repair.midCents -
    holdingCostCents -
    sellingCostCents;

  const netMarginPct = (netProfitCents / input.arvCents) * 100;

  // Target: net profit ≥ 15% ARV OR ≥ $30k (whichever higher)
  const floorCents = Math.max(
    Math.round(input.arvCents * 0.15),
    3_000_000, // $30k in cents
  );
  const meetsThresholds = netProfitCents >= floorCents;

  return {
    purchaseAssumedCents,
    holdingCostCents,
    sellingCostCents,
    netProfitCents,
    netMarginPct,
    meetsThresholds,
  };
}

/* ─── BUY & HOLD ─────────────────────────────────────────────── */

export function computeHold(
  input: AnalysisInput,
  repair: RepairEstimate,
): HoldResult {
  const monthlyRentCents = input.estimatedRentCents ?? 0;
  const annualRentCents = monthlyRentCents * 12;

  // 50% rule NOI (rough)
  const noiAnnualCents = Math.round(annualRentCents * 0.5);

  // Assume PITI at ~0.65% of purchase price/month as rough placeholder
  const assumedPitiMonthly = Math.round(input.askingPriceCents * 0.0065);
  const managementCents = Math.round(monthlyRentCents * 0.1);
  const vacancyCents = Math.round(monthlyRentCents * 0.05);
  const maintenanceCents = Math.round(monthlyRentCents * 0.05);

  const monthlyCashFlowCents =
    monthlyRentCents -
    assumedPitiMonthly -
    managementCents -
    vacancyCents -
    maintenanceCents;

  const purchasePlusRepair = input.askingPriceCents + repair.midCents;
  const capRatePct =
    purchasePlusRepair > 0 ? (noiAnnualCents / purchasePlusRepair) * 100 : 0;

  // Cash-on-cash assumes 25% down + repair all cash
  const cashInvested = Math.round(input.askingPriceCents * 0.25) + repair.midCents;
  const annualCashFlow = monthlyCashFlowCents * 12;
  const cashOnCashPct =
    cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;

  const meetsThresholds = capRatePct >= 6 && monthlyCashFlowCents >= 15_000; // $150/mo

  return {
    monthlyRentCents,
    noiAnnualCents,
    monthlyCashFlowCents,
    capRatePct,
    cashOnCashPct,
    meetsThresholds,
  };
}
