"use client";

import type { SavedDeal } from "./store";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { StateCode } from "@/lib/compliance/types";

const LS_KEY = "wholesail:deals:v1";
const MIGRATED_KEY = "wholesail:deals:migrated";

export async function migrateLocalDealsToSupabase(firmId: string): Promise<{
  migrated: number;
  skipped: boolean;
}> {
  if (typeof window === "undefined") return { migrated: 0, skipped: true };
  if (window.localStorage.getItem(MIGRATED_KEY) === "1") {
    return { migrated: 0, skipped: true };
  }

  let deals: SavedDeal[] = [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) {
      window.localStorage.setItem(MIGRATED_KEY, "1");
      return { migrated: 0, skipped: true };
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(MIGRATED_KEY, "1");
      return { migrated: 0, skipped: true };
    }
    deals = parsed;
  } catch {
    window.localStorage.setItem(MIGRATED_KEY, "1");
    return { migrated: 0, skipped: true };
  }

  if (deals.length === 0) {
    window.localStorage.setItem(MIGRATED_KEY, "1");
    return { migrated: 0, skipped: true };
  }

  const sb = supabaseBrowser();
  const rows = deals.map((d) => ({
    firm_id: firmId,
    state: (d.draft?.state as StateCode | null) ?? null,
    status: d.status,
    draft: d.draft,
    analysis: d.analysis ?? null,
    ai_narrative: d.aiNarrative ?? null,
    metadata: {
      compliance: d.compliance,
      notes: d.notes,
      aiDocs: d.aiDocs,
    },
  }));

  const { error } = await sb.from("deals").insert(rows);
  if (error) {
    return { migrated: 0, skipped: false };
  }

  window.localStorage.setItem(MIGRATED_KEY, "1");
  window.localStorage.removeItem(LS_KEY);
  return { migrated: rows.length, skipped: false };
}
