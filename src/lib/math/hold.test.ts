import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeHold } from "./hold";

describe("computeHold", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 240_000,
    purchasePrice: 180_000,
    rehabCost: 30_000,
    marketRentMonthly: 2_000,
    propertyTaxAnnual: 3_600,
    insuranceAnnual: 1_200,
    interestRate: 0.075,
    loanTermYears: 30,
    downPct: 0.25,
    hoaMonthly: 0,
  };

  it("effectiveRent = grossRent * (1 − vacancy)", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.effectiveRent).toBeCloseTo(24_000 * 0.92, 2);
  });

  it("NOI subtracts tax+ins+hoa + opex % of effectiveRent", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    const eff = 24_000 * 0.92;
    const fixed = 3_600 + 1_200 + 0 * 12;
    const pctOpex = eff * (0.08 + 0.05 + 0.05);
    const opex = fixed + pctOpex;
    expect(h.operatingExpense).toBeCloseTo(opex, 2);
    expect(h.noi).toBeCloseTo(eff - opex, 2);
  });

  it("capRate = NOI / purchasePrice", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.capRate).toBeCloseTo(h.noi / base.purchasePrice, 6);
  });

  it("cashFlow = NOI − annual debt service", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.cashFlow).toBeCloseTo(h.noi - s.monthlyMortgagePI * 12, 2);
  });

  it("DSCR = NOI / debtService", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.dscr).toBeCloseTo(h.noi / (s.monthlyMortgagePI * 12), 6);
  });

  it("BRRRR refi-out = ARV*0.75 − loan principal", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.brrrrRefiOut).toBeCloseTo(240_000 * 0.75 - s.loanAmount, 2);
  });

  it("1% rule pass when rent/price >= 0.01", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.meetsOnePctRule).toBe(2_000 / 180_000 >= 0.01);
  });
});
