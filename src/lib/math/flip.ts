import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface FlipResultV2 {
  acquisitionCost: number;
  holdingCost: number;
  sellingCost: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  annualizedRoi: number;
  violatesSeventyRule: boolean;
  meetsThresholds: boolean;
}

export function computeFlip(
  i: MathInputs,
  s: SharedDerived,
): FlipResultV2 {
  const acquisitionCost = i.purchasePrice + s.closingBuy;
  const monthlyInterestOnly = (i.purchasePrice * i.interestRate) / 12;
  const monthlyCarry =
    monthlyInterestOnly +
    i.propertyTaxAnnual / 12 +
    i.insuranceAnnual / 12 +
    i.hoaMonthly +
    i.utilitiesMonthly;
  const holdingCost = monthlyCarry * i.holdingMonths;
  const sellingCost = s.closingSell;
  const totalCost =
    acquisitionCost + i.rehabCost + holdingCost + sellingCost;
  const netProfit = i.arv - totalCost;
  const investedCash = s.downPayment + i.rehabCost + holdingCost;
  const roi = investedCash > 0 ? netProfit / investedCash : 0;
  const annualizedRoi =
    i.holdingMonths > 0 ? roi * (12 / i.holdingMonths) : 0;
  const violatesSeventyRule =
    i.purchasePrice > i.arv * 0.7 - i.rehabCost;
  const profitFloor = Math.max(i.arv * 0.15, 30_000);
  const meetsThresholds = netProfit >= profitFloor && !violatesSeventyRule;
  return {
    acquisitionCost,
    holdingCost,
    sellingCost,
    totalCost,
    netProfit,
    roi,
    annualizedRoi,
    violatesSeventyRule,
    meetsThresholds,
  };
}
