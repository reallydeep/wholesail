import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function addWaitlistEntry(args: {
  email: string;
  state: string;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("waitlist").insert({
    email: args.email.toLowerCase().trim(),
    state: args.state.toUpperCase(),
  });
}
