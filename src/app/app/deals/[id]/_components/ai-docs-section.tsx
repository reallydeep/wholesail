"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeals, type SavedDeal } from "@/lib/deals/store";
import { buildSnapshot } from "@/lib/ai/snapshot";
import { snapshotHash } from "@/lib/ai/hash";
import { requestDoc } from "@/lib/ai/use-ai";
import type { AiDocDraft, AiDocKind } from "@/lib/ai/types";

const DOCS: { kind: AiDocKind; title: string; blurb: string }[] = [
  {
    kind: "cover-letter",
    title: "Cover letter",
    blurb: "Principal-to-seller letter that rides with your offer package.",
  },
  {
    kind: "market-memo",
    title: "Market memo",
    blurb: "Internal read on why this submarket supports the ARV.",
  },
  {
    kind: "seller-outreach",
    title: "Seller outreach",
    blurb: "Short first-touch message — text or email.",
  },
  {
    kind: "buyer-brief",
    title: "Assignment buyer brief",
    blurb: "Packet for your cash buyer list — numbers up front.",
  },
];

export function AiDocsSection({ deal }: { deal: SavedDeal }) {
  const { patch } = useDeals();
  const snapshot = React.useMemo(
    () => buildSnapshot(deal.draft, deal.analysis),
    [deal.draft, deal.analysis],
  );
  const currentHash = React.useMemo(() => snapshotHash(snapshot), [snapshot]);
  const [pending, setPending] = React.useState<AiDocKind | null>(null);
  const [expanded, setExpanded] = React.useState<AiDocKind | null>(null);

  async function generate(kind: AiDocKind) {
    setPending(kind);
    try {
      const draft = await requestDoc(kind, snapshot);
      const next = { ...(deal.aiDocs ?? {}), [kind]: draft };
      patch(deal.id, { aiDocs: next });
      setExpanded(kind);
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="rounded-[10px] border border-rule bg-parchment p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-xl text-ink">AI drafts</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Claude writes the narrative pieces — cover letters, buyer briefs, market memos. They stay tied to this deal&rsquo;s inputs and mark themselves stale when the numbers move.
          </p>
        </div>
      </div>
      <ul className="grid gap-2">
        {DOCS.map((doc) => {
          const stored = deal.aiDocs?.[doc.kind];
          const isStale = !!stored && stored.inputHash !== currentHash;
          const isPending = pending === doc.kind;
          const isExpanded = expanded === doc.kind;
          return (
            <li
              key={doc.kind}
              className={cn(
                "border rounded-[8px] overflow-hidden transition-colors",
                isExpanded ? "border-forest-200 bg-surface-raised" : "border-rule bg-surface-raised/60",
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : doc.kind)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bone-deep/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base text-ink">{doc.title}</span>
                    {stored?.source === "ai" && (
                      <Badge tone="forest">AI</Badge>
                    )}
                    {stored?.source === "deterministic" && (
                      <Badge tone="neutral">Template</Badge>
                    )}
                    {isStale && <Badge tone="clay">Stale</Badge>}
                  </div>
                  <p className="text-xs text-ink-soft mt-1">{doc.blurb}</p>
                  {stored && (
                    <p className="text-[10px] text-ink-faint mt-1 font-mono uppercase tracking-[0.12em]">
                      Generated {new Date(stored.generatedAt).toLocaleDateString()} · hash {stored.inputHash}
                    </p>
                  )}
                </div>
                <svg
                  className={cn(
                    "w-4 h-4 text-ink-faint mt-1 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-rule px-4 py-4 animate-rise">
                  {!stored && !isPending && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-ink-soft">
                        Nothing generated yet. Claude will draft this from the current deal inputs.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => generate(doc.kind)}
                      >
                        Generate
                      </Button>
                    </div>
                  )}
                  {isPending && (
                    <div className="grid gap-2">
                      <div className="h-3 shimmer-bar rounded-full w-5/6" />
                      <div className="h-3 shimmer-bar rounded-full w-4/5" />
                      <div className="h-3 shimmer-bar rounded-full w-3/4" />
                      <p className="text-xs text-ink-faint mt-2 font-mono uppercase tracking-[0.14em]">
                        Claude drafting…
                      </p>
                    </div>
                  )}
                  {stored && !isPending && (
                    <DocBody doc={stored} isStale={isStale} onRegen={() => generate(doc.kind)} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DocBody({
  doc,
  isStale,
  onRegen,
}: {
  doc: AiDocDraft;
  isStale: boolean;
  onRegen: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="font-display text-lg text-ink">{doc.title}</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(doc.body)}
          >
            Copy
          </Button>
          <Button variant={isStale ? "primary" : "outline"} size="sm" onClick={onRegen}>
            {isStale ? "Regenerate" : "Refresh"}
          </Button>
        </div>
      </div>
      {isStale && (
        <p className="text-[11px] text-clay-600 bg-[#f4e0d8] border border-[#e8c9bc] px-3 py-2 rounded-[4px]">
          Deal inputs changed since this was generated. Regenerate to sync.
        </p>
      )}
      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink font-display tracking-tight bg-bone-deep/40 border border-rule rounded-[6px] p-4 max-h-[380px] overflow-y-auto">
        {doc.body}
      </pre>
    </div>
  );
}
