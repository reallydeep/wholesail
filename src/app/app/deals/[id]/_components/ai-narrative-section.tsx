"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDeals, type SavedDeal } from "@/lib/deals/store";
import { buildSnapshot } from "@/lib/ai/snapshot";
import { snapshotHash } from "@/lib/ai/hash";
import type { AiAnalysisNarrative } from "@/lib/ai/types";

export function AiNarrativeSection({ deal }: { deal: SavedDeal }) {
  const { patch } = useDeals();
  const snapshot = React.useMemo(
    () => buildSnapshot(deal.draft, deal.analysis),
    [deal.draft, deal.analysis],
  );
  const currentHash = React.useMemo(() => snapshotHash(snapshot), [snapshot]);
  const stored = deal.aiNarrative;
  const isStale = !!stored && stored.inputHash !== currentHash;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const regenerate = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as AiAnalysisNarrative;
      patch(deal.id, { aiNarrative: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [snapshot, patch, deal.id]);

  React.useEffect(() => {
    if (stored || loading) return;
    const t = setTimeout(() => regenerate(), 0);
    return () => clearTimeout(t);
  }, [stored, loading, regenerate]);

  return (
    <section className="rounded-[10px] border border-rule bg-forest-900 text-bone p-6 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brass-300 font-mono font-medium">
            Claude&rsquo;s read
          </span>
          {stored?.source === "ai" && (
            <Badge tone="brass" className="bg-brass-500/20 text-brass-300 border-brass-300/20">
              Live AI
            </Badge>
          )}
          {stored?.source === "deterministic" && (
            <Badge tone="neutral" className="bg-white/10 text-bone/70 border-transparent">
              Template
            </Badge>
          )}
          {isStale && (
            <Badge tone="clay" className="bg-clay-500/20 text-clay-400 border-clay-500/30">
              Stale · inputs changed
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={regenerate}
          disabled={loading}
          className="text-[10px] uppercase tracking-[0.16em] text-brass-300/80 hover:text-brass-300 font-mono font-medium disabled:opacity-40 flex items-center gap-1.5"
        >
          {loading ? "Reading…" : isStale ? "Regenerate" : "Refresh"}
          {loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-brass-300 animate-pulse-dot" />
          )}
        </button>
      </div>

      {loading && !stored && (
        <div className="grid gap-3">
          <div className="h-3 shimmer-bar rounded-full w-3/4" />
          <div className="h-3 shimmer-bar rounded-full w-5/6" />
          <div className="h-3 shimmer-bar rounded-full w-2/3" />
        </div>
      )}

      {error && !stored && (
        <p className="text-sm text-clay-400">
          AI read failed. <button className="underline" onClick={regenerate}>Try again</button>
        </p>
      )}

      {stored && (
        <div className="grid gap-5 animate-rise">
          <div>
            <h3 className="font-display text-3xl leading-tight tracking-tight">
              {stored.headline}
            </h3>
            <p className="text-sm text-bone/70 mt-2 leading-relaxed max-w-2xl">
              {stored.thesis}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <NarrativeColumn label="Opportunities" items={stored.opportunities} tone="forest" />
            <NarrativeColumn label="Risks" items={stored.risks} tone="clay" />
            <NarrativeColumn label="Negotiation" items={stored.negotiation} tone="brass" />
          </div>
          <p className="text-[10px] text-bone/40 font-mono uppercase tracking-[0.14em]">
            Generated {new Date(stored.generatedAt).toLocaleString()} · hash {stored.inputHash}
            {isStale && ` → current ${currentHash}`}
          </p>
        </div>
      )}
    </section>
  );
}

function NarrativeColumn({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "forest" | "clay" | "brass";
}) {
  const accent = {
    forest: "text-forest-300",
    clay: "text-clay-400",
    brass: "text-brass-300",
  }[tone];
  const dot = {
    forest: "bg-forest-400/80",
    clay: "bg-clay-500/80",
    brass: "bg-brass-400/80",
  }[tone];
  return (
    <div>
      <div className={cn("text-[10px] uppercase tracking-[0.2em] font-mono font-medium mb-3", accent)}>
        {label}
      </div>
      <ul className="grid gap-2.5 text-sm text-bone/85 leading-relaxed">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={cn("mt-1.5 block w-1 h-1 rounded-full flex-none", dot)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
