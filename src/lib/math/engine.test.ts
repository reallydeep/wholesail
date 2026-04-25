import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { runEngine } from "./engine";

describe("runEngine", () => {
  it("returns all three strategies + state factors + sensitivity", () => {
    const r = runEngine({
      ...DEFAULT_INPUTS,
      arv: 300_000,
      purchasePrice: 180_000,
      rehabCost: 40_000,
      marketRentMonthly: 2_000,
      state: "OH",
    });
    expect(r.wholesale).toBeDefined();
    expect(r.flip).toBeDefined();
    expect(r.hold).toBeDefined();
    expect(r.shared).toBeDefined();
    expect(r.stateFactors.disclosureRequired).toBe(true);
    expect(r.sensitivity.length).toBe(3);
    expect(r.engineVersion).toMatch(/^\d+\.\d+/);
  });

  it("rejects invalid inputs", () => {
    expect(() => runEngine({ ...DEFAULT_INPUTS, arv: -1 })).toThrow();
  });
});
