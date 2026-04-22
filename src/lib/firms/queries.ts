import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FirmRow, MembershipRow } from "@/lib/supabase/types";
import type { StateCode } from "@/lib/compliance/types";

export async function createFirmForOwner(args: {
  userId: string;
  firmName: string;
  states: StateCode[];
  trialDays?: number;
}): Promise<{ firm: FirmRow; membership: MembershipRow }> {
  const admin = supabaseAdmin();
  const trialEnds = new Date(
    Date.now() + (args.trialDays ?? 7) * 864e5,
  ).toISOString();

  const { data: firm, error: e1 } = await admin
    .from("firms")
    .insert({
      name: args.firmName,
      plan: "trialing",
      state_scope: args.states,
      trial_ends_at: trialEnds,
    })
    .select("*")
    .single<FirmRow>();
  if (e1 || !firm) throw new Error(e1?.message ?? "firm insert failed");

  const { data: membership, error: e2 } = await admin
    .from("memberships")
    .insert({ firm_id: firm.id, user_id: args.userId, role: "owner" })
    .select("*")
    .single<MembershipRow>();
  if (e2 || !membership) throw new Error(e2?.message ?? "membership insert failed");

  return { firm, membership };
}
