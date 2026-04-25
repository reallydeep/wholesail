"use client";

import * as React from "react";
import { useSupabaseSession } from "@/lib/auth/use-supabase-session";
import { migrateLocalDealsToSupabase } from "@/lib/deals/migrate";

export function DealMigrationRunner() {
  const { firm, loading } = useSupabaseSession();
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (loading || !firm || ran.current) return;
    ran.current = true;
    void migrateLocalDealsToSupabase(firm.id);
  }, [firm, loading]);

  return null;
}
