import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/supabase-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runInspection } from "@/lib/ai/inspector/run";
import {
  assertInspectionQuota,
  recordInspectionRun,
} from "@/lib/ai/inspector/rate-limit";
import { snapshotHash } from "@/lib/ai/inspector/snapshot-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireServerSession();
  const { id } = await ctx.params;

  try {
    await assertInspectionQuota({
      firmId: session.firm.id,
      plan: session.firm.plan,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "quota error" },
      { status: 429 },
    );
  }

  const admin = supabaseAdmin();
  const { data: deal, error } = await admin
    .from("deals")
    .select("id, firm_id, draft, analysis, ai_inspection, ai_inspection_hash")
    .eq("id", id)
    .single();
  if (error || !deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }
  if (deal.firm_id !== session.firm.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const math = deal.analysis?.mathV2;
  if (!math) {
    return NextResponse.json(
      { error: "deal has no mathV2 snapshot — save the wizard first" },
      { status: 409 },
    );
  }

  const hash = snapshotHash({ draft: deal.draft, math });
  if (deal.ai_inspection && deal.ai_inspection_hash === hash) {
    return NextResponse.json({ inspection: deal.ai_inspection, cached: true });
  }

  let inspection;
  try {
    inspection = await runInspection({ draft: deal.draft, math });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "inspect failed" },
      { status: 500 },
    );
  }

  await admin
    .from("deals")
    .update({
      ai_inspection: inspection,
      ai_inspection_hash: hash,
      ai_inspection_at: new Date().toISOString(),
    })
    .eq("id", id);

  await recordInspectionRun({ firmId: session.firm.id, dealId: id });

  return NextResponse.json({ inspection, cached: false });
}
