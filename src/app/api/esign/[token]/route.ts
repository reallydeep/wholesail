import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv, useSupabase } from "@/lib/env";
import { isLikelySigningToken } from "@/lib/esign/token";

// Public route: anyone with the token can fetch the signing request and
// submit a signature. No auth header required — the token is the secret.
// We use the SERVICE ROLE key on the server so RLS doesn't block lookups
// for unauthenticated signers.

function svc() {
  const env = serverEnv();
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

function getIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  return real ?? null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!useSupabase) {
    return NextResponse.json({ error: "esign disabled" }, { status: 503 });
  }
  const { token } = await ctx.params;
  if (!isLikelySigningToken(token)) {
    return NextResponse.json({ error: "bad token" }, { status: 400 });
  }
  const sb = svc();
  const { data, error } = await sb
    .from("signing_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Mark viewed on first GET.
  if (data.status === "pending") {
    await sb
      .from("signing_requests")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  // Also surface a doc snapshot the seller needs to read before signing.
  const { data: deal } = await sb
    .from("deals")
    .select("draft, state, status")
    .eq("id", data.deal_id)
    .maybeSingle();

  return NextResponse.json({ request: data, deal });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!useSupabase) {
    return NextResponse.json({ error: "esign disabled" }, { status: 503 });
  }
  const { token } = await ctx.params;
  if (!isLikelySigningToken(token)) {
    return NextResponse.json({ error: "bad token" }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as
    | { signaturePng?: string; typedName?: string; consent?: boolean }
    | null;
  if (
    !body ||
    typeof body.signaturePng !== "string" ||
    !body.signaturePng.startsWith("data:image/png;base64,") ||
    typeof body.typedName !== "string" ||
    body.typedName.trim().length < 2 ||
    body.consent !== true
  ) {
    return NextResponse.json({ error: "invalid signature payload" }, { status: 400 });
  }
  // Reject huge payloads (~500KB cap).
  if (body.signaturePng.length > 700_000) {
    return NextResponse.json({ error: "signature too large" }, { status: 413 });
  }

  const sb = svc();
  const { data: existing } = await sb
    .from("signing_requests")
    .select("id, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.status === "signed") {
    return NextResponse.json({ error: "already signed" }, { status: 409 });
  }
  if (new Date(existing.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await sb
    .from("signing_requests")
    .update({
      status: "signed",
      signature_png: body.signaturePng,
      typed_name: body.typedName.trim(),
      consent: true,
      signed_at: now,
      ip: getIp(req),
      user_agent: req.headers.get("user-agent"),
    })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "update failed" }, { status: 500 });
  }
  return NextResponse.json({ request: updated });
}
