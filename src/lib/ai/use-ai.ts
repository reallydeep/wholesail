"use client";

import * as React from "react";
import type { AiAnalysisNarrative, AiDocDraft, AiDocKind, DealSnapshotForAi } from "./types";
import { snapshotHash } from "./hash";

type Cached<T> = { value: T; hash: string };

export function useAiNarrative(snapshot: DealSnapshotForAi | null, opts?: { eager?: boolean }) {
  const [data, setData] = React.useState<AiAnalysisNarrative | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cacheRef = React.useRef<Cached<AiAnalysisNarrative> | null>(null);

  const hash = snapshot ? snapshotHash(snapshot) : null;

  const fetcher = React.useCallback(async () => {
    if (!snapshot || !hash) return;
    if (cacheRef.current?.hash === hash) {
      setData(cacheRef.current.value);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
      const json = (await res.json()) as AiAnalysisNarrative;
      cacheRef.current = { hash, value: json };
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [snapshot, hash]);

  React.useEffect(() => {
    if (!opts?.eager || !snapshot) return;
    const t = setTimeout(() => fetcher(), 0);
    return () => clearTimeout(t);
  }, [fetcher, opts?.eager, snapshot]);

  return { data, loading, error, refresh: fetcher };
}

export async function requestDoc(kind: AiDocKind, snapshot: DealSnapshotForAi): Promise<AiDocDraft> {
  const res = await fetch("/api/ai/doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, snapshot }),
  });
  if (!res.ok) throw new Error(`Doc request failed: ${res.status}`);
  return (await res.json()) as AiDocDraft;
}
