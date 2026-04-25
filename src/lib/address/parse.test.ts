import { describe, it, expect } from "vitest";
import { parseAddress } from "./parse";

describe("parseAddress", () => {
  it("parses standard one-line address with state code", () => {
    const r = parseAddress("123 Main St, Columbus, OH 43215");
    expect(r.street).toBe("123 Main St");
    expect(r.city).toBe("Columbus");
    expect(r.state).toBe("OH");
    expect(r.zip).toBe("43215");
    expect(r.warnings).toEqual([]);
  });

  it("strips pasted price and finds state at end (regression)", () => {
    const r = parseAddress("$269,999\n5948 Hidden Arbor Dr, El Paso, TX 79924");
    expect(r.street).toBe("5948 Hidden Arbor Dr");
    expect(r.city).toBe("El Paso");
    expect(r.state).toBe("TX");
    expect(r.zip).toBe("79924");
    expect(r.warnings).toEqual([]);
  });

  it("ignores non-state two-letter caps tokens like DR or EL", () => {
    const r = parseAddress("100 OAK DR, EL PASO, TX 79901");
    expect(r.state).toBe("TX");
    expect(r.city).toBe("El Paso");
  });

  it("warns when state is unsupported instead of silently picking wrong code", () => {
    const r = parseAddress("1 Sample Rd, Anchorage, AK 99501");
    expect(r.state).toBeUndefined();
    expect(r.warnings.some((w) => w.includes("supported state"))).toBe(true);
  });

  it("supports all green-tier states by code", () => {
    for (const code of ["AL", "GA", "TN", "VA", "MI", "WI"]) {
      const r = parseAddress(`1 Test St, City, ${code} 12345`);
      expect(r.state).toBe(code);
    }
  });
});
