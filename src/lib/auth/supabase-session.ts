import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { FirmRow, MembershipRow } from "@/lib/supabase/types";

export interface ServerSession {
  userId: string;
  email: string;
  firm: FirmRow;
  membership: MembershipRow;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: membership } = await sb
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<MembershipRow>();
  if (!membership) return null;

  const { data: firm } = await sb
    .from("firms")
    .select("*")
    .eq("id", membership.firm_id)
    .maybeSingle<FirmRow>();
  if (!firm) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    firm,
    membership,
  };
}

export async function requireServerSession(): Promise<ServerSession> {
  const s = await getServerSession();
  if (!s) redirect("/signin");
  return s;
}
