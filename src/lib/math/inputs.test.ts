import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS, validateInputs, type MathInputs } from "./inputs";

describe("MathInputs", () => {
  it("defaults match spec", () => {
    expect(DEFAULT_INPUTS.closingBuyPct).toBe(0.02);
    expect(DEFAULT_INPUTS.closingSellPct).toBe(0.08);
    expect(DEFAULT_INPUTS.vacancyPct).toBe(0.08);
    expect(DEFAULT_INPUTS.mgmtPct).toBe(0.08);
    expect(DEFAULT_INPUTS.maintenancePct).toBe(0.05);
    expect(DEFAULT_INPUTS.capexPct).toBe(0.05);
    expect(DEFAULT_INPUTS.downPct).toBe(0.2);
    expect(DEFAULT_INPUTS.loanTermYears).toBe(30);
  });

  it("validateInputs rejects negative ARV", () => {
    const bad: Partial<MathInputs> = { arv: -1 };
    expect(() =>
      validateInputs({ ...DEFAULT_INPUTS, ...bad } as MathInputs),
    ).toThrow(/arv/i);
  });

  it("validateInputs rejects purchase > arv * 2 (probably units bug)", () => {
    expect(() =>
      validateInputs({
        ...DEFAULT_INPUTS,
        arv: 100_000,
        purchasePrice: 300_000,
      } as MathInputs),
    ).toThrow(/purchase/i);
  });
});
