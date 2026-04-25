import type { StateCode } from "@/lib/compliance/types";

export interface MathInputs {
  arv: number;
  purchasePrice: number;
  rehabCost: number;

  downPct: number;
  interestRate: number;
  loanTermYears: number;
  holdingMonths: number;

  closingBuyPct: number;
  closingSellPct: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthly: number;

  marketRentMonthly: number;
  vacancyPct: number;
  mgmtPct: number;
  maintenancePct: number;
  capexPct: number;

  targetAssignmentFee: number;

  state: StateCode | null;
}

export const DEFAULT_INPUTS: MathInputs = {
  arv: 0,
  purchasePrice: 0,
  rehabCost: 0,
  downPct: 0.2,
  interestRate: 0.075,
  loanTermYears: 30,
  holdingMonths: 6,
  closingBuyPct: 0.02,
  closingSellPct: 0.08,
  propertyTaxAnnual: 0,
  insuranceAnnual: 1_500,
  hoaMonthly: 0,
  utilitiesMonthly: 150,
  marketRentMonthly: 0,
  vacancyPct: 0.08,
  mgmtPct: 0.08,
  maintenancePct: 0.05,
  capexPct: 0.05,
  targetAssignmentFee: 10_000,
  state: null,
};

export function validateInputs(i: MathInputs): MathInputs {
  if (i.arv < 0) throw new Error("arv must be non-negative");
  if (i.purchasePrice < 0)
    throw new Error("purchasePrice must be non-negative");
  if (i.rehabCost < 0) throw new Error("rehabCost must be non-negative");
  if (i.arv > 0 && i.purchasePrice > i.arv * 2) {
    throw new Error(
      "purchasePrice more than 2× ARV — probably a units/cents bug",
    );
  }
  if (i.downPct < 0 || i.downPct > 1)
    throw new Error("downPct out of [0,1]");
  if (i.interestRate < 0 || i.interestRate > 0.3) {
    throw new Error("interestRate out of [0, 30%]");
  }
  if (i.loanTermYears < 1 || i.loanTermYears > 40) {
    throw new Error("loanTermYears out of [1, 40]");
  }
  return i;
}
