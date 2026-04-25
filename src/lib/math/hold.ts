import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface HoldResultV2 {
  grossRent: number;
  effectiveRent: number;
  operatingExpense: number;
  noi: number;
  capRate: number;
  cashFlow: number;
  cashOnCash: number;
  dscr: number;
  meetsOnePctRule: boolean;
  brrrrRefiOut: number;
  meetsThresholds: boolean;
}

export function computeHold(
  i: MathInputs,
  s: SharedDerived,
): HoldResultV2 {
  const grossRent = i.marketRentMonthly * 12;
  const effectiveRent = grossRent * (1 - i.vacancyPct);
  const fixedOpex =
    i.propertyTaxAnnual + i.insuranceAnnual + i.hoaMonthly * 12;
  const pctOpex =
    effectiveRent * (i.mgmtPct + i.maintenancePct + i.capexPct);
  const operatingExpense = fixedOpex + pctOpex;
  const noi = effectiveRent - operatingExpense;
  const capRate = i.purchasePrice > 0 ? noi / i.purchasePrice : 0;
  const debtService = s.monthlyMortgagePI * 12;
  const cashFlow = noi - debtService;
  const cashInvested = s.downPayment + i.rehabCost + s.closingBuy;
  const cashOnCash = cashInvested > 0 ? cashFlow / cashInvested : 0;
  const dscr = debtService > 0 ? noi / debtService : 0;
  const meetsOnePctRule =
    i.purchasePrice > 0
      ? i.marketRentMonthly / i.purchasePrice >= 0.01
      : false;
  const brrrrRefiOut = i.arv * 0.75 - s.loanAmount;
  const meetsThresholds = dscr >= 1.2 && cashFlow >= 1_800;
  return {
    grossRent,
    effectiveRent,
    operatingExpense,
    noi,
    capRate,
    cashFlow,
    cashOnCash,
    dscr,
    meetsOnePctRule,
    brrrrRefiOut,
    meetsThresholds,
  };
}
