import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/supabase-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { geocode } from "@/lib/geo/nominatim";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fullAddress(d: DealDraft): string | null {
  const parts = [
    d.propertyAddress,
    d.propertyCity,
    d.state,
    d.propertyZip,
  ].filter(Boolean);
  if (parts.length < 2) return null;
  return parts.join(", ");
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireServerSession();
  const { id } = await ctx.params;
  const admin = supabaseAdmin();
  const { data: deal, error } = await admin
    .from("deals")
    .select("id, firm_id, draft, lat, lon")
    .eq("id", id)
    .single();
  if (error || !deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }
  if (deal.firm_id !== session.firm.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (deal.lat != null && deal.lon != null) {
    return NextResponse.json({ lat: deal.lat, lon: deal.lon, cached: true });
  }
  const addr = fullAddress(deal.draft as DealDraft);
  if (!addr) {
    return NextResponse.json({ error: "address incomplete" }, { status: 400 });
  }
  const hit = await geocode(addr);
  if (!hit) {
    return NextResponse.json({ error: "geocode failed" }, { status: 404 });
  }
  await admin
    .from("deals")
    .update({
      lat: hit.lat,
      lon: hit.lon,
      geocoded_at: new Date().toISOString(),
    })
    .eq("id", id);
  return NextResponse.json({ ...hit, cached: false });
}
