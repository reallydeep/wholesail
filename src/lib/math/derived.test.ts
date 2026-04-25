import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";

describe("deriveShared", () => {
  it("20% down on $200k → $40k down, $160k loan", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 200_000,
      arv: 280_000,
    });
    expect(s.downPayment).toBe(40_000);
    expect(s.loanAmount).toBe(160_000);
  });

  it("closingBuy = purchase * closingBuyPct", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 250_000,
      arv: 350_000,
    });
    expect(s.closingBuy).toBe(250_000 * 0.02);
  });

  it("monthly PITI has principal+interest+tax+ins", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 200_000,
      arv: 280_000,
      propertyTaxAnnual: 3_600,
      insuranceAnnual: 1_200,
    });
    expect(s.monthlyPiti).toBeGreaterThan(
      s.monthlyMortgagePI + 3_600 / 12 + 1_200 / 12 - 1,
    );
  });
});
