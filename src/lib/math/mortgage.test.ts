import { describe, it, expect } from "vitest";
import { monthlyMortgage, totalInterest } from "./mortgage";

describe("mortgage", () => {
  it("monthlyMortgage matches standard amortization (200k, 7%, 30yr)", () => {
    const m = monthlyMortgage(200_000, 0.07, 30);
    expect(m).toBeGreaterThan(1330);
    expect(m).toBeLessThan(1331);
  });

  it("zero-interest loan reduces to principal / months", () => {
    const m = monthlyMortgage(120_000, 0, 10);
    expect(m).toBeCloseTo(1000, 2);
  });

  it("totalInterest over life = monthlyMortgage*n − principal", () => {
    const principal = 200_000;
    const m = monthlyMortgage(principal, 0.07, 30);
    const interest = totalInterest(principal, 0.07, 30);
    expect(interest).toBeCloseTo(m * 360 - principal, 0);
  });
});
