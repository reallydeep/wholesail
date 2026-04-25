"use client";

import * as React from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { ComplianceDecision, StateCode } from "@/lib/compliance/types";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";
import type { AiAnalysisNarrative, AiDocDraft, AiDocKind } from "@/lib/ai/types";
import type { DealInspection } from "@/lib/ai/inspector/schema";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useSupabase } from "@/lib/env";

export type DealStatus = "prospect" | "contract" | "closed";

export interface SavedDeal {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: DealStatus;
  draft: DealDraft;
  analysis?: AnalysisResult;
  compliance?: ComplianceDecision;
  notes?: string;
  aiNarrative?: AiAnalysisNarrative;
  aiDocs?: Partial<Record<AiDocKind, AiDocDraft>>;
  aiInspection?: DealInspection;
}

// ─── Legacy localStorage path ────────────────────────────────────────
const LS_KEY = "wholesail:deals:v1";
const LS_EVENT = "wholesail:deals-changed";

function lsRead(): SavedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lsWrite(deals: SavedDeal[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(LS_EVENT));
}

function lsSubscribe(cb: () => void) {
  window.addEventListener(LS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function lsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(LS_KEY) ?? "[]";
}

// ─── Supabase row shape ──────────────────────────────────────────────
interface DealRowWire {
  id: string;
  firm_id: string;
  state: StateCode | null;
  status: DealStatus;
  draft: DealDraft;
  analysis: AnalysisResult | null;
  ai_narrative: AiAnalysisNarrative | null;
  ai_inspection: DealInspection | null;
  snapshot_hash: string | null;
  updated_at: string;
  created_at: string;
  // compliance + notes + aiDocs live in metadata column — or derived.
  // For now we store them inside draft.meta to keep the wire slim.
  metadata?: {
    compliance?: ComplianceDecision;
    notes?: string;
    aiDocs?: Partial<Record<AiDocKind, AiDocDraft>>;
  } | null;
}

function fromRow(r: DealRowWire): SavedDeal {
  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    status: r.status,
    draft: r.draft,
    analysis: r.analysis ?? undefined,
    compliance: r.metadata?.compliance,
    notes: r.metadata?.notes,
    aiNarrative: r.ai_narrative ?? undefined,
    aiDocs: r.metadata?.aiDocs,
    aiInspection: r.ai_inspection ?? undefined,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────
export interface DealsApi {
  deals: SavedDeal[];
  loading: boolean;
  save: (
    deal: Omit<SavedDeal, "id" | "createdAt" | "updatedAt" | "status"> & {
      id?: string;
      status?: DealStatus;
    },
  ) => Promise<SavedDeal>;
  updateStatus: (id: string, status: DealStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => SavedDeal | undefined;
  patch: (id: string, fields: Partial<SavedDeal>) => Promise<void>;
}

export function useDeals(): DealsApi {
  return useSupabase ? useDealsSupabase() : useDealsLocal();
}

// ---- Supabase-backed implementation ----
function useDealsSupabase(): DealsApi {
  const [deals, setDeals] = React.useState<SavedDeal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [firmId, setFirmId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const sb = supabaseBrowser();

    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: membership } = await sb
        .from("memberships")
        .select("firm_id")
        .eq("user_id", user.id)
        .maybeSingle<{ firm_id: string }>();
      if (!membership || cancelled) return;
      setFirmId(membership.firm_id);

      const { data: rows } = await sb
        .from("deals")
        .select("*")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      setDeals(((rows ?? []) as DealRowWire[]).map(fromRow));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = React.useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: rows } = await sb
      .from("deals")
      .select("*")
      .order("updated_at", { ascending: false });
    setDeals(((rows ?? []) as DealRowWire[]).map(fromRow));
  }, []);

  const save: DealsApi["save"] = React.useCallback(
    async (deal) => {
      const sb = supabaseBrowser();
      if (!firmId) throw new Error("no firm");
      const basePayload = {
        firm_id: firmId,
        state: (deal.draft?.state as StateCode | null) ?? null,
        status: deal.status ?? "prospect",
        draft: deal.draft,
        analysis: deal.analysis ?? null,
        ai_narrative: deal.aiNarrative ?? null,
        metadata: {
          compliance: deal.compliance,
          notes: deal.notes,
          aiDocs: deal.aiDocs,
        },
      };
      if (deal.id) {
        const { data, error } = await sb
          .from("deals")
          .update(basePayload)
          .eq("id", deal.id)
          .select("*")
          .single<DealRowWire>();
        if (error || !data) throw error ?? new Error("update failed");
        await refetch();
        return fromRow(data);
      } else {
        const { data, error } = await sb
          .from("deals")
          .insert(basePayload)
          .select("*")
          .single<DealRowWire>();
        if (error || !data) throw error ?? new Error("insert failed");
        await refetch();
        return fromRow(data);
      }
    },
    [firmId, refetch],
  );

  const updateStatus: DealsApi["updateStatus"] = React.useCallback(
    async (id, status) => {
      const sb = supabaseBrowser();
      await sb.from("deals").update({ status }).eq("id", id);
      await refetch();
    },
    [refetch],
  );

  const remove: DealsApi["remove"] = React.useCallback(
    async (id) => {
      const sb = supabaseBrowser();
      await sb.from("deals").delete().eq("id", id);
      await refetch();
    },
    [refetch],
  );

  const get: DealsApi["get"] = React.useCallback(
    (id) => deals.find((d) => d.id === id),
    [deals],
  );

  const patch: DealsApi["patch"] = React.useCallback(
    async (id, fields) => {
      const sb = supabaseBrowser();
      const row: Record<string, unknown> = {};
      if ("status" in fields) row.status = fields.status;
      if ("draft" in fields) row.draft = fields.draft;
      if ("analysis" in fields) row.analysis = fields.analysis ?? null;
      if ("aiNarrative" in fields) row.ai_narrative = fields.aiNarrative ?? null;
      // merge-style metadata update — read then write
      if (
        "compliance" in fields ||
        "notes" in fields ||
        "aiDocs" in fields
      ) {
        const { data: cur } = await sb
          .from("deals")
          .select("metadata")
          .eq("id", id)
          .maybeSingle<{ metadata: DealRowWire["metadata"] }>();
        row.metadata = {
          ...(cur?.metadata ?? {}),
          ...("compliance" in fields ? { compliance: fields.compliance } : {}),
          ...("notes" in fields ? { notes: fields.notes } : {}),
          ...("aiDocs" in fields ? { aiDocs: fields.aiDocs } : {}),
        };
      }
      await sb.from("deals").update(row).eq("id", id);
      await refetch();
    },
    [refetch],
  );

  return { deals, loading, save, updateStatus, remove, get, patch };
}

// ---- LocalStorage-backed legacy implementation ----
function useDealsLocal(): DealsApi {
  const raw = React.useSyncExternalStore(lsSubscribe, lsSnapshot, () => "[]");
  const deals = React.useMemo<SavedDeal[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const save: DealsApi["save"] = React.useCallback(
    async (deal) => {
      const now = new Date().toISOString();
      const existing = deal.id ? deals.find((d) => d.id === deal.id) : undefined;
      const next: SavedDeal = {
        id:
          deal.id ??
          `WS-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        status: deal.status ?? existing?.status ?? "prospect",
        draft: deal.draft,
        analysis: deal.analysis,
        compliance: deal.compliance,
        notes: deal.notes ?? existing?.notes,
        aiNarrative: deal.aiNarrative ?? existing?.aiNarrative,
        aiDocs: deal.aiDocs ?? existing?.aiDocs,
      };
      const filtered = deals.filter((d) => d.id !== next.id);
      lsWrite([next, ...filtered]);
      return next;
    },
    [deals],
  );

  const updateStatus: DealsApi["updateStatus"] = React.useCallback(
    async (id, status) => {
      lsWrite(
        deals.map((d) =>
          d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d,
        ),
      );
    },
    [deals],
  );

  const remove: DealsApi["remove"] = React.useCallback(
    async (id) => {
      lsWrite(deals.filter((d) => d.id !== id));
    },
    [deals],
  );

  const get: DealsApi["get"] = React.useCallback(
    (id) => deals.find((d) => d.id === id),
    [deals],
  );

  const patch: DealsApi["patch"] = React.useCallback(
    async (id, fields) => {
      lsWrite(
        deals.map((d) =>
          d.id === id
            ? { ...d, ...fields, updatedAt: new Date().toISOString() }
            : d,
        ),
      );
    },
    [deals],
  );

  return { deals, loading: false, save, updateStatus, remove, get, patch };
}

export function readDealsSync(): SavedDeal[] {
  return lsRead();
}
