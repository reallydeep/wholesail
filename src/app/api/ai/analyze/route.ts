import { NextResponse } from "next/server";
import { generateJson, hasAiKey } from "@/lib/ai/client";
import { fallbackNarrative } from "@/lib/ai/fallback";
import { snapshotHash } from "@/lib/ai/hash";
import type { AiAnalysisNarrative, DealSnapshotForAi } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are the Wholesail desk analyst. Review a real-estate wholesale/flip/hold opportunity and return a single JSON object — no prose before or after — with these fields:
{
  "headline": "short punch line, <=12 words",
  "thesis": "one paragraph, 40-70 words, editorial tone, direct and unvarnished",
  "opportunities": ["3-4 strings, each 12-22 words, concrete upside"],
  "risks": ["3-4 strings, each 12-22 words, concrete downside"],
  "negotiation": ["2-3 strings, each 10-20 words, specific levers to pull"]
}

Voice: careful, dealmaker-to-dealmaker, no hype. Never invent numbers not in the input. Speak in plain English.`;

export async function POST(req: Request) {
  let snap: DealSnapshotForAi;
  try {
    snap = (await req.json()) as DealSnapshotForAi;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!hasAiKey()) {
    return NextResponse.json(fallbackNarrative(snap));
  }

  try {
    const user = `Here are the facts captured about the deal. Return only the JSON object.\n\n${JSON.stringify(snap, null, 2)}`;
    const ai = await generateJson<Omit<AiAnalysisNarrative, "source" | "generatedAt" | "inputHash">>({
      system: SYSTEM,
      user,
      maxTokens: 900,
    });
    if (!ai) return NextResponse.json(fallbackNarrative(snap));
    const payload: AiAnalysisNarrative = {
      headline: ai.headline,
      thesis: ai.thesis,
      opportunities: ai.opportunities,
      risks: ai.risks,
      negotiation: ai.negotiation,
      source: "ai",
      generatedAt: new Date().toISOString(),
      inputHash: snapshotHash(snap),
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("ai/analyze failed", err);
    return NextResponse.json(fallbackNarrative(snap));
  }
}
