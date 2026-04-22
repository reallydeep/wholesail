"use client";

import * as React from "react";
import Link from "next/link";
import { Container, SectionLabel } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeals, type DealStatus, type SavedDeal } from "@/lib/deals/store";
import { SUPPORTED_STATES } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";
import { buildSnapshot } from "@/lib/ai/snapshot";
import { snapshotHash } from "@/lib/ai/hash";
import { formatCurrency, cn } from "@/lib/utils";

const COLUMNS: {
  key: DealStatus;
  label: string;
  sub: string;
  hint: string;
}[] = [
  {
    key: "prospect",
    label: "Prospect",
    sub: "LOI sent · awaiting",
    hint: "Fresh leads from the wizard land here.",
  },
  {
    key: "contract",
    label: "Under contract",
    sub: "PSA signed · in inspection",
    hint: "Once the PSA is signed, advance deals here.",
  },
  {
    key: "closed",
    label: "Assigned or closed",
    sub: "Wire sent · ledger closed",
    hint: "Final state. Money on the table.",
  },
];

type StateFilter = "all" | StateCode;
type StrategyFilter = "all" | "wholesale" | "flip" | "hold";
type SortMode = "newest" | "updated" | "spread";

export default function PipelinePage() {
  const { deals, updateStatus, remove } = useDeals();
  const [stateFilter, setStateFilter] = React.useState<StateFilter>("all");
  const [strategyFilter, setStrategyFilter] = React.useState<StrategyFilter>("all");
  const [sort, setSort] = React.useState<SortMode>("updated");

  const filtered = React.useMemo(() => {
    return deals.filter((d) => {
      if (stateFilter !== "all" && d.draft.state !== stateFilter) return false;
      if (strategyFilter !== "all" && d.draft.strategy !== strategyFilter) return false;
      return true;
    });
  }, [deals, stateFilter, strategyFilter]);

  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    if (sort === "newest") {
      copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sort === "updated") {
      copy.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    } else if (sort === "spread") {
      copy.sort(
        (a, b) =>
          (b.analysis?.wholesale?.profitSpreadCents ?? -Infinity) -
          (a.analysis?.wholesale?.profitSpreadCents ?? -Infinity),
      );
    }
    return copy;
  }, [filtered, sort]);

  const grouped = COLUMNS.reduce<Record<DealStatus, SavedDeal[]>>(
    (acc, c) => {
      acc[c.key] = sorted.filter((d) => d.status === c.key);
      return acc;
    },
    { prospect: [], contract: [], closed: [] },
  );

  const feesEarned = deals
    .filter((d) => d.status === "closed" && d.draft.assignmentFeeCents)
    .reduce((s, d) => s + (d.draft.assignmentFeeCents ?? 0), 0);

  const staleCount = deals.filter((d) => {
    if (!d.aiNarrative) return false;
    const hash = snapshotHash(buildSnapshot(d.draft, d.analysis));
    return d.aiNarrative.inputHash !== hash;
  }).length;

  const hasFilter = stateFilter !== "all" || strategyFilter !== "all";

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <header className="grid gap-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <SectionLabel>Pipeline · Ledger</SectionLabel>
              <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mt-2 tracking-tight">
                {deals.length === 0 ? "Your desk." : `${sorted.length} on the desk.`}
              </h1>
              <p className="text-ink-soft mt-2 max-w-md">
                {deals.length === 0
                  ? "The ledger is empty. Every deal starts with a walk-through and a number."
                  : hasFilter
                    ? "Filtered view. Clear filters to see the full ledger."
                    : "Drag deals forward as they move. Click a card to open the ledger."}
              </p>
            </div>
            <Link href="/app/deals/new">
              <Button variant="primary" size="lg">
                <span>Start a deal</span>
                <ChevronRight />
              </Button>
            </Link>
          </div>

          {deals.length > 0 && (
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-6 flex-wrap pb-4 border-b border-rule">
              <FilterGroup
                label="State"
                value={stateFilter}
                onChange={setStateFilter}
                options={[
                  { value: "all", label: "All" },
                  ...SUPPORTED_STATES.map((s) => ({ value: s.code, label: s.code })),
                ]}
              />
              <FilterGroup
                label="Strategy"
                value={strategyFilter}
                onChange={setStrategyFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "wholesale", label: "Wholesale" },
                  { value: "flip", label: "Flip" },
                  { value: "hold", label: "Hold" },
                ]}
              />
              <FilterGroup
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "updated", label: "Updated" },
                  { value: "newest", label: "Newest" },
                  { value: "spread", label: "Best spread" },
                ]}
              />
              {staleCount > 0 && (
                <div className="ml-auto flex items-center gap-2 text-xs text-clay-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-clay-500 animate-pulse-dot" />
                  <span className="font-mono uppercase tracking-[0.14em]">
                    {staleCount} AI narrative{staleCount === 1 ? "" : "s"} stale
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="grid md:grid-cols-[1.1fr_1fr_1fr] gap-4 items-start">
          {COLUMNS.map((col, i) => {
            const items = grouped[col.key];
            return (
              <section
                key={col.key}
                className={cn(
                  "flex flex-col border border-rule rounded-[10px] bg-parchment overflow-hidden min-h-[360px]",
                  `stagger-in-${i + 1}`,
                )}
              >
                <header className="flex items-start justify-between px-5 py-4 border-b border-dashed border-rule">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-brass-700 font-medium">
                      {String(i + 1).padStart(2, "0")} · {col.label}
                    </div>
                    <div className="text-[11px] text-ink-faint mt-1">{col.sub}</div>
                  </div>
                  <Badge tone="neutral" className="tabular-nums">
                    {items.length}
                  </Badge>
                </header>

                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                    <StackIcon />
                    <p className="text-sm text-ink-soft max-w-[24ch] leading-relaxed">
                      {hasFilter ? "Nothing here with those filters." : col.hint}
                    </p>
                    {i === 0 && !hasFilter && (
                      <Link
                        href="/app/deals/new"
                        className="text-xs uppercase tracking-[0.16em] text-forest-700 hover:text-forest-900 transition-colors font-medium mt-1 inline-flex items-center gap-1.5"
                      >
                        Draft the first one
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <ul className="flex-1 flex flex-col gap-2 p-3">
                    {items.map((d, idx) => (
                      <DealRow
                        key={d.id}
                        deal={d}
                        index={idx}
                        onAdvance={() => advance(d, updateStatus)}
                        onRemove={() => remove(d.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-10 border-t border-rule pt-6 grid grid-cols-1 sm:grid-cols-4 gap-6">
          <StatTile label="Deals drafted" value={String(deals.length)} mono />
          <StatTile
            label="Under contract"
            value={String(deals.filter((d) => d.status === "contract").length)}
            mono
          />
          <StatTile
            label="Closed"
            value={String(deals.filter((d) => d.status === "closed").length)}
            mono
          />
          <StatTile
            label="Assignment fees earned"
            value={formatCurrency(feesEarned)}
            mono
          />
        </div>
      </Container>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint font-mono font-medium">
        {label}
      </span>
      <div className="flex gap-1 p-1 bg-bone-deep/40 rounded-[6px] border border-rule/60">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] font-medium rounded-[3px] transition-colors",
                active
                  ? "bg-forest-700 text-bone"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function advance(
  deal: SavedDeal,
  updateStatus: (id: string, s: DealStatus) => void,
) {
  const next: Record<DealStatus, DealStatus> = {
    prospect: "contract",
    contract: "closed",
    closed: "closed",
  };
  updateStatus(deal.id, next[deal.status]);
}

function daysBetween(iso: string): number {
  const ms = Date.now() - +new Date(iso);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function DealRow({
  deal,
  index,
  onAdvance,
  onRemove,
}: {
  deal: SavedDeal;
  index: number;
  onAdvance: () => void;
  onRemove: () => void;
}) {
  const d = deal.draft;
  const addr = d.propertyAddress
    ? `${d.propertyAddress}${d.propertyCity ? `, ${d.propertyCity}` : ""}`
    : "Untitled deal";

  const decisionTone: Record<string, string> = {
    pursue: "bg-forest-50 text-forest-700 border-forest-200",
    review: "bg-brass-50 text-brass-700 border-brass-100",
    pass: "bg-[#f4e0d8] text-clay-600 border-[#e8c9bc]",
  };

  const days = daysBetween(deal.updatedAt);
  const freshnessTone =
    days <= 2 ? "text-forest-700" : days <= 14 ? "text-brass-700" : "text-clay-600";

  const currentHash = snapshotHash(buildSnapshot(deal.draft, deal.analysis));
  const aiStale = !!deal.aiNarrative && deal.aiNarrative.inputHash !== currentHash;

  return (
    <li
      className="group relative"
      style={{ animation: `rise-in 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 40}ms both` }}
    >
      <Link
        href={`/app/deals/${deal.id}`}
        className="block rounded-[8px] border border-rule bg-surface-raised hover:border-forest-300 hover:-translate-y-0.5 transition-all p-3"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] text-ink leading-tight truncate">
              {addr}
            </p>
            <p className="text-[11px] text-ink-faint mt-0.5 uppercase tracking-[0.12em] font-mono truncate">
              {deal.id.slice(0, 14)} · {d.state ?? "??"} · {d.strategy ?? "?"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {deal.analysis && (
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] font-medium rounded-[3px] border",
                  decisionTone[deal.analysis.decision],
                )}
              >
                {deal.analysis.decision}
              </span>
            )}
            {aiStale && (
              <span className="text-[9px] uppercase tracking-[0.12em] text-clay-600 font-mono font-medium">
                AI stale
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] text-ink-soft tabular-nums">
            {d.askingPriceCents != null && (
              <span>ask {formatCurrency(d.askingPriceCents)}</span>
            )}
            {d.arvCents != null && (
              <span className="text-ink-faint">arv {formatCurrency(d.arvCents)}</span>
            )}
          </div>
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.12em] font-mono font-medium",
              freshnessTone,
            )}
          >
            {days === 0 ? "today" : `${days}d ago`}
          </span>
        </div>
      </Link>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {deal.status !== "closed" && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAdvance();
            }}
            className="text-[10px] uppercase tracking-[0.14em] px-2 py-1 bg-forest-700 text-bone rounded-[3px] hover:bg-forest-800"
            title="Advance to next column"
          >
            Advance
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (confirm("Remove this deal?")) onRemove();
          }}
          className="text-[10px] uppercase tracking-[0.14em] px-2 py-1 bg-clay-600 text-bone rounded-[3px] hover:bg-clay-500"
          title="Remove"
        >
          Del
        </button>
      </div>
    </li>
  );
}

function StatTile({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">
        {label}
      </div>
      <div
        className={cn(
          "text-3xl text-ink leading-none",
          mono ? "font-mono tabular-nums" : "font-display",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brass-500/70"
      aria-hidden
    >
      <rect x="6" y="9" width="20" height="5" rx="1" />
      <rect x="6" y="17" width="20" height="5" rx="1" opacity="0.5" />
      <path d="M10 26h12" opacity="0.3" />
    </svg>
  );
}
