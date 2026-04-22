import { NextResponse } from "next/server";
import { generateJson, hasAiKey } from "@/lib/ai/client";
import { fallbackDoc } from "@/lib/ai/fallback";
import { snapshotHash } from "@/lib/ai/hash";
import type { AiDocDraft, AiDocKind, DealSnapshotForAi } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROMPTS: Record<AiDocKind, { system: string; hint: string }> = {
  "cover-letter": {
    system: `You draft cover letters that accompany a real estate offer. Write one clean, personable letter from a principal buyer to the seller. Never invent facts. Use the exact price, address, and ARV supplied.`,
    hint: "Write a cover letter (250-350 words) accompanying the offer.",
  },
  "market-memo": {
    system: `You write concise market memos for internal use — no hype, no filler, editorial tone. Acknowledge when data is estimated. Never invent comps.`,
    hint: "Write an internal market memo (220-320 words) that contextualizes the deal.",
  },
  "seller-outreach": {
    system: `You draft first-touch messages to potential sellers. Short, respectful, zero hard sell. Sound human, not scripted.`,
    hint: "Draft an outreach message (120-180 words).",
  },
  "buyer-brief": {
    system: `You package an assignment opportunity for a cash buyer. Lead with the numbers. No adjectives without evidence.`,
    hint: "Draft a buyer brief (250-350 words) that presents the assignment.",
  },
};

export async function POST(req: Request) {
  let body: { kind?: AiDocKind; snapshot?: DealSnapshotForAi };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const kind = body.kind;
  const snap = body.snapshot;
  if (!kind || !snap || !(kind in PROMPTS)) {
    return NextResponse.json({ error: "Missing kind or snapshot" }, { status: 400 });
  }

  if (!hasAiKey()) {
    return NextResponse.json(fallbackDoc(kind, snap));
  }

  try {
    const { system, hint } = PROMPTS[kind];
    const user = `${hint}\n\nReturn JSON: { "title": "...", "body": "..." } with no prose around it.\n\nFacts:\n${JSON.stringify(snap, null, 2)}`;
    const ai = await generateJson<{ title: string; body: string }>({
      system,
      user,
      maxTokens: 1400,
    });
    if (!ai) return NextResponse.json(fallbackDoc(kind, snap));
    const payload: AiDocDraft = {
      kind,
      title: ai.title,
      body: ai.body,
      source: "ai",
      generatedAt: new Date().toISOString(),
      inputHash: snapshotHash(snap),
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("ai/doc failed", err);
    return NextResponse.json(fallbackDoc(kind, snap));
  }
}
