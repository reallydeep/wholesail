import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/supabase/types";

const LIMITS: Record<Plan, number> = {
  trialing: 5,
  scout: 0,
  operator: 20,
  firm: 50,
  canceled: 0,
};

export async function assertInspectionQuota(opts: {
  firmId: string;
  plan: Plan;
}): Promise<void> {
  const limit = LIMITS[opts.plan];
  if (limit === 0) {
    throw new Error("Inspector not available on your plan");
  }
  const admin = supabaseAdmin();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await admin
    .from("ai_runs")
    .select("*", { count: "exact", head: true })
    .eq("firm_id", opts.firmId)
    .eq("kind", "inspection")
    .gte("created_at", since.toISOString());
  if (error) throw new Error(`quota check: ${error.message}`);
  if ((count ?? 0) >= limit) {
    throw new Error(`Daily inspection quota reached (${limit}/day)`);
  }
}

export async function recordInspectionRun(opts: {
  firmId: string;
  dealId: string;
  tokensInput?: number;
  tokensOutput?: number;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("ai_runs").insert({
    firm_id: opts.firmId,
    deal_id: opts.dealId,
    kind: "inspection",
    tokens_input: opts.tokensInput ?? null,
    tokens_output: opts.tokensOutput ?? null,
  });
}
