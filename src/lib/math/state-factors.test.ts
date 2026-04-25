import { describe, it, expect } from "vitest";
import { applyStateFactors } from "./state-factors";

describe("applyStateFactors", () => {
  it("FL adds 3 business days to effectiveCloseDate", () => {
    const contractDate = new Date("2026-05-01T00:00:00Z"); // Friday UTC
    const f = applyStateFactors("FL", contractDate);
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-06");
    expect(f.disclosureRequired).toBe(true);
  });

  it("OH requires equitable-interest disclosure but no date shift", () => {
    const contractDate = new Date("2026-05-01T00:00:00Z");
    const f = applyStateFactors("OH", contractDate);
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(f.disclosureRequired).toBe(true);
    expect(f.extraFrictionHours).toBeGreaterThan(0);
  });

  it("unsupported state → passthrough (no shift, no disclosure)", () => {
    const contractDate = new Date("2026-05-01T00:00:00Z");
    const f = applyStateFactors(null, contractDate);
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(f.disclosureRequired).toBe(false);
  });
});
