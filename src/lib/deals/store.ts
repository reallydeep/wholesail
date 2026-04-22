"use client";

import * as React from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { ComplianceDecision } from "@/lib/compliance/types";
import type { DealDraft } from "@/app/app/deals/new/_lib/types";

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
}

const KEY = "wholesail:deals:v1";
const EVENT = "wholesail:deals-changed";

function read(): SavedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(deals: SavedDeal[]) {
  window.localStorage.setItem(KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(KEY) ?? "[]";
}

export function useDeals(): {
  deals: SavedDeal[];
  save: (deal: Omit<SavedDeal, "id" | "createdAt" | "updatedAt" | "status"> & {
    id?: string;
    status?: DealStatus;
  }) => SavedDeal;
  updateStatus: (id: string, status: DealStatus) => void;
  remove: (id: string) => void;
  get: (id: string) => SavedDeal | undefined;
} {
  const raw = React.useSyncExternalStore(subscribe, snapshot, () => "[]");
  const deals = React.useMemo<SavedDeal[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const save = React.useCallback(
    (deal: Parameters<ReturnType<typeof useDeals>["save"]>[0]) => {
      const now = new Date().toISOString();
      const existing = deal.id ? deals.find((d) => d.id === deal.id) : undefined;
      const next: SavedDeal = {
        id: deal.id ?? `WS-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        status: deal.status ?? existing?.status ?? "prospect",
        draft: deal.draft,
        analysis: deal.analysis,
        compliance: deal.compliance,
        notes: deal.notes ?? existing?.notes,
      };
      const filtered = deals.filter((d) => d.id !== next.id);
      write([next, ...filtered]);
      return next;
    },
    [deals],
  );

  const updateStatus = React.useCallback(
    (id: string, status: DealStatus) => {
      const updated = deals.map((d) =>
        d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d,
      );
      write(updated);
    },
    [deals],
  );

  const remove = React.useCallback(
    (id: string) => {
      write(deals.filter((d) => d.id !== id));
    },
    [deals],
  );

  const get = React.useCallback(
    (id: string) => deals.find((d) => d.id === id),
    [deals],
  );

  return { deals, save, updateStatus, remove, get };
}

export function readDealsSync(): SavedDeal[] {
  return read();
}
