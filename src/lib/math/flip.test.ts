import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeFlip } from "./flip";

describe("computeFlip", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    holdingMonths: 6,
    interestRate: 0.08,
    propertyTaxAnnual: 3_600,
    insuranceAnnual: 1_200,
    utilitiesMonthly: 150,
    hoaMonthly: 0,
  };

  it("holdingCost includes interest-only on loan + prorated tax/ins + hoa + util", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    const expectedMonthly =
      (180_000 * 0.08) / 12 + 3_600 / 12 + 1_200 / 12 + 0 + 150;
    expect(f.holdingCost).toBeCloseTo(expectedMonthly * 6, 1);
  });

  it("sellingCost = ARV * closingSellPct", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    expect(f.sellingCost).toBe(300_000 * 0.08);
  });

  it("netProfit = ARV − totalCost", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    expect(f.netProfit).toBeCloseTo(base.arv - f.totalCost, 2);
  });

  it("70% rule flag fires when purchase > ARV*0.70 − rehab", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    expect(f.violatesSeventyRule).toBe(true);
  });

  it("annualizedRoi is finite when holdingMonths is zero (guards div-by-zero)", () => {
    const s = deriveShared({ ...base, holdingMonths: 0 });
    const f = computeFlip({ ...base, holdingMonths: 0 }, s);
    expect(Number.isFinite(f.annualizedRoi)).toBe(true);
  });
});
