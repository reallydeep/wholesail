"use client";

import * as React from "react";
import type { DealKiller } from "@/lib/ai/inspector/schema";
import { cn } from "@/lib/utils";

const SEV_ORDER: Record<DealKiller["severity"], number> = {
  critical: 0,
  major: 1,
  minor: 2,
};
const SEV_TONE: Record<DealKiller["severity"], string> = {
  critical: "border-clay-400 bg-clay-50/50",
  major: "border-brass-300 bg-brass-50/40",
  minor: "border-rule bg-parchment",
};
const SEV_LABEL: Record<DealKiller["severity"], string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export function DealKillers({ killers }: { killers: DealKiller[] }) {
  const sorted = [...killers].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
  );
  if (sorted.length === 0) {
    return (
      <div className="rounded-[10px] border border-rule bg-parchment p-6 text-center text-sm text-ink-soft">
        No deal killers flagged. Clean file.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl text-ink">Deal killers</h3>
      {sorted.map((k, i) => (
        <KillerCard key={i} killer={k} />
      ))}
    </div>
  );
}

function KillerCard({ killer }: { killer: DealKiller }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <article
      className={cn(
        "rounded-[10px] border p-5 space-y-3",
        SEV_TONE[killer.severity],
      )}
    >
      <header className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.14em] font-medium px-2 py-0.5 rounded-full",
            killer.severity === "critical"
              ? "bg-clay-600 text-bone"
              : killer.severity === "major"
                ? "bg-brass-600 text-bone"
                : "bg-ink-faint/20 text-ink-soft",
          )}
        >
          {SEV_LABEL[killer.severity]}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint font-mono">
          {killer.category}
        </span>
        {killer.state_citation && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-soft font-mono ml-auto border border-rule rounded-full px-2 py-0.5">
            {killer.state_citation}
          </span>
        )}
      </header>
      <div>
        <h4 className="text-sm font-medium text-ink">{killer.headline}</h4>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          {killer.detail}
        </p>
      </div>
      <div className="border-t border-rule/60 pt-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium mb-1">
          Negotiation angle
        </div>
        <p className="text-sm text-ink italic leading-relaxed">
          &ldquo;{killer.negotiation_angle}&rdquo;
        </p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(killer.negotiation_angle);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
        >
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
      </div>
      <div className="text-[10px] text-ink-faint font-mono">
        Evidence: {killer.evidence}
      </div>
    </article>
  );
}
