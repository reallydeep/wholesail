import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { EngineResult } from "@/lib/math";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";
import { retrieveForDeal } from "@/lib/kb/retrieve";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { DealInspectionSchema, type DealInspection } from "./schema";
import type { StateCode } from "@/lib/compliance/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function runInspection(opts: {
  draft: DealDraft;
  math: EngineResult;
  model?: string;
}): Promise<DealInspection> {
  const model = opts.model ?? DEFAULT_MODEL;
  const state = (opts.draft.state as StateCode | null) ?? null;
  const queryText = [
    `Wholesale deal in ${opts.draft.propertyCity ?? ""} ${opts.draft.state ?? ""}`,
    opts.draft.repairNotes ?? "",
    `condition ${opts.draft.conditionRating ?? ""} occupancy ${opts.draft.occupancy ?? ""}`,
  ].join(". ");
  const kb = await retrieveForDeal({ state, queryText, k: 5 });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    system: buildSystemPrompt(),
    tools: [
      {
        name: "record_inspection",
        description:
          "Record the full deal inspection result. Call exactly once.",
        input_schema: {
          type: "object",
          properties: {
            leverage_score: { type: "integer", minimum: 0, maximum: 100 },
            suggested_offer: { type: "number", minimum: 0 },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            killers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: {
                    type: "string",
                    enum: ["critical", "major", "minor"],
                  },
                  category: {
                    type: "string",
                    enum: [
                      "title",
                      "structural",
                      "market",
                      "legal",
                      "financial",
                      "tenant",
                      "environmental",
                      "timeline",
                    ],
                  },
                  headline: { type: "string" },
                  detail: { type: "string" },
                  negotiation_angle: { type: "string" },
                  evidence: { type: "string" },
                  state_citation: { type: "string" },
                },
                required: [
                  "severity",
                  "category",
                  "headline",
                  "detail",
                  "negotiation_angle",
                  "evidence",
                ],
              },
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  detail: { type: "string" },
                  action: { type: "string" },
                },
                required: ["headline", "detail", "action"],
              },
            },
            comparables_needed: { type: "array", items: { type: "string" } },
          },
          required: [
            "leverage_score",
            "suggested_offer",
            "confidence",
            "killers",
            "opportunities",
            "comparables_needed",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "record_inspection" },
    messages: [
      {
        role: "user",
        content: buildUserMessage({ draft: opts.draft, math: opts.math, kb }),
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not call record_inspection tool");
  }

  return DealInspectionSchema.parse(toolUse.input);
}
