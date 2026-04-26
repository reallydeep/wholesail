import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/supabase-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateSigningToken } from "@/lib/esign/token";
import type { CreateSigningRequestInput } from "@/lib/esign/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOC_TYPES = new Set(["offer-letter", "psa", "assignment"]);
const ROLES = new Set(["seller", "buyer"]);

export async function POST(req: Request) {
  const session = await requireServerSession();
  const body = (await req.json().catch(() => null)) as
    | CreateSigningRequestInput
    | null;
  if (
    !body ||
    typeof body.dealId !== "string" ||
    !DOC_TYPES.has(body.docType) ||
    !ROLES.has(body.signerRole)
  ) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: deal } = await admin
    .from("deals")
    .select("id, firm_id")
    .eq("id", body.dealId)
    .maybeSingle<{ id: string; firm_id: string }>();
  if (!deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }
  if (deal.firm_id !== session.firm.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = generateSigningToken();
  const { data, error } = await admin
    .from("signing_requests")
    .insert({
      token,
      firm_id: session.firm.id,
      deal_id: body.dealId,
      doc_type: body.docType,
      signer_role: body.signerRole,
      signer_name: body.signerName ?? null,
      signer_email: body.signerEmail ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "create failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ request: data });
}
