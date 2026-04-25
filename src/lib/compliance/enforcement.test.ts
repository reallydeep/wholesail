import { describe, it, expect } from "vitest";
import {
  requiresContractDisclosure,
  isAckedFor,
  flCooldownExpiresAt,
  canSendToBuyer,
} from "./enforcement";

describe("requiresContractDisclosure", () => {
  it("OH → SB131", () => {
    expect(requiresContractDisclosure("OH")).toBe("OH_SB131");
  });
  it("FL → null", () => {
    expect(requiresContractDisclosure("FL")).toBeNull();
  });
  it("TX → null", () => {
    expect(requiresContractDisclosure("TX")).toBeNull();
  });
});

describe("isAckedFor", () => {
  it("returns true when ack present", () => {
    expect(
      isAckedFor(
        {
          disclosuresAck: [{ code: "OH_SB131", at: "2026-04-25T00:00:00Z" }],
        },
        "OH_SB131",
      ),
    ).toBe(true);
  });
  it("returns false when missing", () => {
    expect(isAckedFor({}, "OH_SB131")).toBe(false);
  });
});

describe("flCooldownExpiresAt", () => {
  it("returns null for non-FL", () => {
    expect(
      flCooldownExpiresAt({
        state: "OH",
        contractAt: "2026-04-25T00:00:00Z",
      }),
    ).toBeNull();
  });
  it("returns null when no contractAt", () => {
    expect(flCooldownExpiresAt({ state: "FL" })).toBeNull();
  });
  it("FL + contractAt → 72hr later", () => {
    const out = flCooldownExpiresAt({
      state: "FL",
      contractAt: "2026-04-25T00:00:00Z",
    });
    expect(out).toBe("2026-04-28T00:00:00.000Z");
  });
});

describe("canSendToBuyer", () => {
  it("non-FL → ok", () => {
    expect(canSendToBuyer({ state: "TX" }).ok).toBe(true);
  });
  it("FL within cooldown → blocked", () => {
    const r = canSendToBuyer(
      { state: "FL", contractAt: "2026-04-25T00:00:00Z" },
      new Date("2026-04-26T00:00:00Z"),
    );
    expect(r.ok).toBe(false);
    expect(r.unlocksAt).toBe("2026-04-28T00:00:00.000Z");
  });
  it("FL after cooldown → ok", () => {
    const r = canSendToBuyer(
      { state: "FL", contractAt: "2026-04-25T00:00:00Z" },
      new Date("2026-04-29T00:00:00Z"),
    );
    expect(r.ok).toBe(true);
  });
});
