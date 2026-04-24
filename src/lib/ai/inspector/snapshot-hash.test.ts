import { describe, it, expect } from "vitest";
import { snapshotHash } from "./snapshot-hash";

describe("snapshotHash", () => {
  const base = {
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    marketRentMonthly: 2_000,
    state: "OH",
  };

  it("same inputs → same hash", () => {
    expect(snapshotHash(base)).toBe(snapshotHash({ ...base }));
  });

  it("different ARV → different hash", () => {
    expect(snapshotHash(base)).not.toBe(
      snapshotHash({ ...base, arv: 310_000 }),
    );
  });

  it("field order doesn't matter (stable serialize)", () => {
    const a = snapshotHash({ a: 1, b: 2 } as unknown as typeof base);
    const b = snapshotHash({ b: 2, a: 1 } as unknown as typeof base);
    expect(a).toBe(b);
  });

  it("result is short hex", () => {
    const h = snapshotHash(base);
    expect(h).toMatch(/^[0-9a-f]+$/);
    expect(h.length).toBeLessThanOrEqual(16);
  });
});
