"use client";
import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useSupabase } from "@/lib/env";
import type { FirmRow, MembershipRow } from "@/lib/supabase/types";

export interface ClientSession {
  user: User | null;
  membership: MembershipRow | null;
  firm: FirmRow | null;
  loading: boolean;
}

const EMPTY: ClientSession = {
  user: null,
  membership: null,
  firm: null,
  loading: true,
};

const DISABLED: ClientSession = {
  user: null,
  membership: null,
  firm: null,
  loading: false,
};

export function useSupabaseSession(): ClientSession {
  const [state, setState] = React.useState<ClientSession>(
    useSupabase ? EMPTY : DISABLED,
  );

  React.useEffect(() => {
    if (!useSupabase) return;
    let sb: ReturnType<typeof supabaseBrowser>;
    try {
      sb = supabaseBrowser();
    } catch {
      setState(DISABLED);
      return;
    }
    let cancelled = false;

    async function resolve(user: User | null) {
      if (!user) {
        if (!cancelled)
          setState({ user: null, membership: null, firm: null, loading: false });
        return;
      }
      const { data: membership } = await sb
        .from("memberships")
        .select("firm_id, user_id, role, created_at")
        .eq("user_id", user.id)
        .maybeSingle<MembershipRow>();
      if (cancelled) return;
      if (!membership) {
        setState({ user, membership: null, firm: null, loading: false });
        return;
      }
      const { data: firm } = await sb
        .from("firms")
        .select("*")
        .eq("id", membership.firm_id)
        .maybeSingle<FirmRow>();
      if (cancelled) return;
      setState({ user, membership, firm: firm ?? null, loading: false });
    }

    sb.auth.getUser().then(({ data: { user } }) => resolve(user));

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      void resolve(s?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
