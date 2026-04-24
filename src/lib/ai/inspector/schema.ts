import { z } from "zod";

export const DealKillerSchema = z.object({
  severity: z.enum(["critical", "major", "minor"]),
  category: z.enum([
    "title",
    "structural",
    "market",
    "legal",
    "financial",
    "tenant",
    "environmental",
    "timeline",
  ]),
  headline: z.string().min(3).max(120),
  detail: z.string().min(10).max(500),
  negotiation_angle: z.string().min(10).max(500),
  evidence: z.string().min(1),
  state_citation: z.string().optional(),
});

export const OpportunitySchema = z.object({
  headline: z.string().min(3).max(120),
  detail: z.string().min(10).max(500),
  action: z.string().min(5).max(200),
});

export const DealInspectionSchema = z.object({
  leverage_score: z.number().int().min(0).max(100),
  suggested_offer: z.number().nonnegative(),
  confidence: z.enum(["low", "medium", "high"]),
  killers: z.array(DealKillerSchema),
  opportunities: z.array(OpportunitySchema),
  comparables_needed: z.array(z.string()),
});

export type DealKiller = z.infer<typeof DealKillerSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type DealInspection = z.infer<typeof DealInspectionSchema>;
