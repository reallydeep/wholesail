import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeWholesale } from "./wholesale";

describe("computeWholesale", () => {
  it("MAO = ARV*0.70 − rehab − fee", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.mao).toBe(160_000);
  });

  it("spread = MAO − purchasePrice", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.spread).toBe(160_000 - 150_000);
    expect(w.meetsThresholds).toBe(true);
  });

  it("assignmentFee floors at max(5000, ARV*0.02)", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 500_000,
      rehabCost: 20_000,
      purchasePrice: 300_000,
      targetAssignmentFee: 1_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.assignmentFeeUsed).toBe(Math.max(5_000, 500_000 * 0.02));
  });

  it("equityToBuyer = ARV − MAO − rehab", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.equityToBuyer).toBe(300_000 - 160_000 - 40_000);
  });
});
