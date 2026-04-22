import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { createFirmForOwner } from "@/lib/firms/queries";
import { addWaitlistEntry } from "@/lib/waitlist/queries";
import { SUPPORTED_STATES } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>(SUPPORTED_STATES.map((s) => s.code));

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firmName: z.string().min(2),
  displayName: z.string().min(1),
  states: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }
  const { email, password, firmName, displayName, states } = parsed.data;

  const supported: StateCode[] = [];
  const unsupported: string[] = [];
  for (const raw of states) {
    const up = raw.toUpperCase();
    if (ALLOWED.has(up)) supported.push(up as StateCode);
    else unsupported.push(up);
  }

  if (supported.length === 0) {
    await addWaitlistEntry({ email, state: unsupported.join(",") || "unspecified" });
    return NextResponse.json(
      { status: "waitlisted", unsupported },
      { status: 202 },
    );
  }

  const admin = supabaseAdmin();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (authErr || !created.user) {
    return NextResponse.json(
      { error: authErr?.message ?? "auth create failed" },
      { status: 400 },
    );
  }

  try {
    await createFirmForOwner({
      userId: created.user.id,
      firmName,
      states: supported,
    });
  } catch (e) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "firm create failed" },
      { status: 500 },
    );
  }

  const sb = await supabaseServer();
  const { error: loginErr } = await sb.auth.signInWithPassword({ email, password });
  if (loginErr) {
    return NextResponse.json({ error: loginErr.message }, { status: 500 });
  }

  for (const u of unsupported) {
    await addWaitlistEntry({ email, state: u });
  }

  return NextResponse.json({ status: "ok", unsupported }, { status: 201 });
}
