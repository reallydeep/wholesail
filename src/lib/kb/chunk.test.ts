import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "./chunk";

describe("chunkMarkdown", () => {
  it("short text → single chunk", () => {
    const c = chunkMarkdown("Hello world.", {
      targetTokens: 500,
      overlapTokens: 50,
    });
    expect(c.length).toBe(1);
    expect(c[0].text).toBe("Hello world.");
  });

  it("long text → multiple chunks with overlap", () => {
    const sentence = "This is a sentence. ";
    const long = sentence.repeat(400);
    const c = chunkMarkdown(long, {
      targetTokens: 500,
      overlapTokens: 50,
    });
    expect(c.length).toBeGreaterThan(2);
    expect(c[1].text.length).toBeGreaterThan(100);
  });

  it("preserves heading context in each chunk", () => {
    const md = `# Title\n\n${"Body sentence. ".repeat(300)}`;
    const c = chunkMarkdown(md, { targetTokens: 300, overlapTokens: 30 });
    c.forEach((ch) => expect(ch.heading).toBe("Title"));
  });
});
