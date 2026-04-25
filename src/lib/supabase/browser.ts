"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, useSupabase } from "@/lib/env";

export function supabaseBrowser() {
  if (
    !useSupabase ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("supabase-disabled");
  }
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
