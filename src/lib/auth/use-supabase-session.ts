"use client";
import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface ClientSession {
  userId: string;
  email: string;
}

export function useSupabaseSession(): ClientSession | null {
  const [session, setSession] = React.useState<ClientSession | null>(null);

  React.useEffect(() => {
    const sb = supabaseBrowser();
    let cancelled = false;

    sb.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      setSession({ userId: user.id, email: user.email ?? "" });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(
        s?.user ? { userId: s.user.id, email: s.user.email ?? "" } : null,
      );
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return session;
}
