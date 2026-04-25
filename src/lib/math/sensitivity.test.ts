import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { runSensitivity } from "./sensitivity";

describe("runSensitivity", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    marketRentMonthly: 2_000,
  };

  it("returns a 3x3 grid for ARV ±10% × rehab ±20%", () => {
    const g = runSensitivity(base);
    expect(g.length).toBe(3);
    expect(g[0].length).toBe(3);
  });

  it("center cell (idx 1,1) matches base engine output", () => {
    const g = runSensitivity(base);
    expect(g[1][1].arvDelta).toBe(0);
    expect(g[1][1].rehabDelta).toBe(0);
  });

  it("higher ARV raises flip.netProfit monotonically", () => {
    const g = runSensitivity(base);
    expect(g[2][1].flip.netProfit).toBeGreaterThan(g[1][1].flip.netProfit);
    expect(g[0][1].flip.netProfit).toBeLessThan(g[1][1].flip.netProfit);
  });

  it("higher rehab lowers flip.netProfit monotonically", () => {
    const g = runSensitivity(base);
    expect(g[1][2].flip.netProfit).toBeLessThan(g[1][1].flip.netProfit);
    expect(g[1][0].flip.netProfit).toBeGreaterThan(g[1][1].flip.netProfit);
  });
});
