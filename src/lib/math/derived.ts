import type { MathInputs } from "./inputs";
import { monthlyMortgage } from "./mortgage";

export interface SharedDerived {
  downPayment: number;
  loanAmount: number;
  closingBuy: number;
  closingSell: number;
  monthlyMortgagePI: number;
  monthlyPiti: number;
  totalAllInAcquisition: number;
}

export function deriveShared(i: MathInputs): SharedDerived {
  const downPayment = i.purchasePrice * i.downPct;
  const loanAmount = i.purchasePrice - downPayment;
  const closingBuy = i.purchasePrice * i.closingBuyPct;
  const closingSell = i.arv * i.closingSellPct;
  const monthlyMortgagePI = monthlyMortgage(
    loanAmount,
    i.interestRate,
    i.loanTermYears,
  );
  const monthlyPiti =
    monthlyMortgagePI +
    i.propertyTaxAnnual / 12 +
    i.insuranceAnnual / 12 +
    i.hoaMonthly +
    i.utilitiesMonthly;
  const totalAllInAcquisition = downPayment + closingBuy + i.rehabCost;
  return {
    downPayment,
    loanAmount,
    closingBuy,
    closingSell,
    monthlyMortgagePI,
    monthlyPiti,
    totalAllInAcquisition,
  };
}
