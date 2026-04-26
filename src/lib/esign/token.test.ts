import { describe, expect, it } from "vitest";
import { generateSigningToken, isLikelySigningToken } from "./token";

describe("generateSigningToken", () => {
  it("produces a URL-safe string of expected length", () => {
    const t = generateSigningToken(16);
    expect(t).toHaveLength(16);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique tokens across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 256; i++) {
      seen.add(generateSigningToken(16));
    }
    expect(seen.size).toBe(256);
  });

  it("respects custom byte length", () => {
    const t = generateSigningToken(32);
    expect(t).toHaveLength(32);
  });

  it("rejects byte lengths under 8", () => {
    expect(() => generateSigningToken(4)).toThrow();
  });
});

describe("isLikelySigningToken", () => {
  it("accepts a freshly generated token", () => {
    expect(isLikelySigningToken(generateSigningToken())).toBe(true);
  });

  it("rejects empty / short / oversized strings", () => {
    expect(isLikelySigningToken("")).toBe(false);
    expect(isLikelySigningToken("abc")).toBe(false);
    expect(isLikelySigningToken("a".repeat(65))).toBe(false);
  });

  it("rejects strings containing forbidden characters", () => {
    expect(isLikelySigningToken("AAAAAAAAAAAAAAAA!")).toBe(false);
    expect(isLikelySigningToken("AAAA AAAA AAAA AAAA")).toBe(false);
    expect(isLikelySigningToken("AAAAAAAA/AAAAAAAA")).toBe(false);
  });
});
