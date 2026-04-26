"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useSupabase } from "@/lib/env";
import { generateSigningToken } from "./token";
import type {
  CreateSigningRequestInput,
  SigningRequest,
  SubmitSignatureInput,
} from "./types";

const LS_KEY = "wholesail:signing-requests:v1";
const LS_EVENT = "wholesail:signing-requests-changed";

// ── localStorage helpers (per-browser preview mode) ────────────────

function lsRead(): SigningRequest[] {
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

function lsWrite(rows: SigningRequest[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(rows));
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

// ── Supabase wire shape ────────────────────────────────────────────

interface SigningRequestRow {
  id: string;
  token: string;
  deal_id: string;
  doc_type: SigningRequest["docType"];
  signer_role: SigningRequest["signerRole"];
  signer_name: string | null;
  signer_email: string | null;
  status: SigningRequest["status"];
  signature_png: string | null;
  typed_name: string | null;
  consent: boolean;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  viewed_at: string | null;
  signed_at: string | null;
  expires_at: string;
}

function fromRow(r: SigningRequestRow): SigningRequest {
  return {
    id: r.id,
    token: r.token,
    dealId: r.deal_id,
    docType: r.doc_type,
    signerRole: r.signer_role,
    signerName: r.signer_name ?? undefined,
    signerEmail: r.signer_email ?? undefined,
    status: r.status,
    signaturePng: r.signature_png ?? undefined,
    typedName: r.typed_name ?? undefined,
    consent: r.consent,
    ip: r.ip ?? undefined,
    userAgent: r.user_agent ?? undefined,
    createdAt: r.created_at,
    viewedAt: r.viewed_at ?? undefined,
    signedAt: r.signed_at ?? undefined,
    expiresAt: r.expires_at,
  };
}

// ── Hook ───────────────────────────────────────────────────────────

export interface SigningRequestsApi {
  requests: SigningRequest[];
  loading: boolean;
  create: (
    input: CreateSigningRequestInput & { firmId?: string },
  ) => Promise<SigningRequest>;
  refresh: () => Promise<void>;
}

export function useSigningRequests(dealId: string | null): SigningRequestsApi {
  return useSupabase
    ? useSigningRequestsSupabase(dealId)
    : useSigningRequestsLocal(dealId);
}

function useSigningRequestsSupabase(
  dealId: string | null,
): SigningRequestsApi {
  const [requests, setRequests] = React.useState<SigningRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [firmId, setFirmId] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!dealId) {
      setLoading(false);
      return;
    }
    let sb: ReturnType<typeof supabaseBrowser>;
    try {
      sb = supabaseBrowser();
    } catch {
      setLoading(false);
      return;
    }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: membership } = await sb
      .from("memberships")
      .select("firm_id")
      .eq("user_id", user.id)
      .maybeSingle<{ firm_id: string }>();
    setFirmId(membership?.firm_id ?? null);

    const { data: rows } = await sb
      .from("signing_requests")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });
    setRequests(((rows ?? []) as SigningRequestRow[]).map(fromRow));
    setLoading(false);
  }, [dealId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const create: SigningRequestsApi["create"] = React.useCallback(
    async (input) => {
      const sb = supabaseBrowser();
      const fid = input.firmId ?? firmId;
      if (!fid) throw new Error("no firm");
      const token = generateSigningToken();
      const { data, error } = await sb
        .from("signing_requests")
        .insert({
          token,
          firm_id: fid,
          deal_id: input.dealId,
          doc_type: input.docType,
          signer_role: input.signerRole,
          signer_name: input.signerName ?? null,
          signer_email: input.signerEmail ?? null,
        })
        .select("*")
        .single<SigningRequestRow>();
      if (error || !data) throw error ?? new Error("create failed");
      const row = fromRow(data);
      setRequests((prev) => [row, ...prev]);
      return row;
    },
    [firmId],
  );

  return { requests, loading, create, refresh: reload };
}

function useSigningRequestsLocal(
  dealId: string | null,
): SigningRequestsApi {
  const raw = React.useSyncExternalStore(lsSubscribe, lsSnapshot, () => "[]");
  const all = React.useMemo<SigningRequest[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);
  const requests = React.useMemo(
    () => (dealId ? all.filter((r) => r.dealId === dealId) : []),
    [all, dealId],
  );

  const create: SigningRequestsApi["create"] = React.useCallback(
    async (input) => {
      const now = new Date().toISOString();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const row: SigningRequest = {
        id: crypto.randomUUID(),
        token: generateSigningToken(),
        dealId: input.dealId,
        docType: input.docType,
        signerRole: input.signerRole,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        status: "pending",
        consent: false,
        createdAt: now,
        expiresAt: expires,
      };
      lsWrite([row, ...all]);
      return row;
    },
    [all],
  );

  return {
    requests,
    loading: false,
    create,
    refresh: async () => {
      // Local mode reads directly from localStorage via useSyncExternalStore;
      // no server fetch needed. The dispatched event re-renders subscribers.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(LS_EVENT));
      }
    },
  };
}

// ── Public submit (called from /sign/[token]) ──────────────────────

export async function submitSignatureLocal(
  token: string,
  input: SubmitSignatureInput,
): Promise<SigningRequest | null> {
  const all = lsRead();
  const idx = all.findIndex((r) => r.token === token);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const updated: SigningRequest = {
    ...all[idx],
    status: "signed",
    signaturePng: input.signaturePng,
    typedName: input.typedName,
    consent: input.consent,
    signedAt: now,
    viewedAt: all[idx].viewedAt ?? now,
    userAgent: navigator.userAgent,
  };
  const next = [...all];
  next[idx] = updated;
  lsWrite(next);
  return updated;
}

export async function fetchByTokenLocal(
  token: string,
): Promise<SigningRequest | null> {
  const found = lsRead().find((r) => r.token === token);
  return found ?? null;
}

// ── Firm-wide hook (used by the Documents library) ────────────────

export interface FirmSigningRequestsApi {
  requests: SigningRequest[];
  loading: boolean;
}

export function useFirmSigningRequests(): FirmSigningRequestsApi {
  return useSupabase
    ? useFirmSigningRequestsSupabase()
    : useFirmSigningRequestsLocal();
}

function useFirmSigningRequestsSupabase(): FirmSigningRequestsApi {
  const [requests, setRequests] = React.useState<SigningRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    let sb: ReturnType<typeof supabaseBrowser>;
    try {
      sb = supabaseBrowser();
    } catch {
      setLoading(false);
      return;
    }
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }
      const { data: membership } = await sb
        .from("memberships")
        .select("firm_id")
        .eq("user_id", user.id)
        .maybeSingle<{ firm_id: string }>();
      if (cancelled) return;
      if (!membership) {
        setLoading(false);
        return;
      }
      const { data: rows } = await sb
        .from("signing_requests")
        .select("*")
        .eq("firm_id", membership.firm_id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setRequests(((rows ?? []) as SigningRequestRow[]).map(fromRow));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { requests, loading };
}

function useFirmSigningRequestsLocal(): FirmSigningRequestsApi {
  const raw = React.useSyncExternalStore(lsSubscribe, lsSnapshot, () => "[]");
  const requests = React.useMemo<SigningRequest[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);
  return { requests, loading: false };
}
