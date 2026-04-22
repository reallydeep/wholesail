"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { Container, SectionLabel } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeals, type DealStatus, type SavedDeal } from "@/lib/deals/store";
import { SUPPORTED_STATES } from "@/lib/compliance";
import { renderDocument } from "@/lib/templates/render";
import type { DocType, DocumentVariables } from "@/lib/templates/types";
import { formatCurrency, cn } from "@/lib/utils";
import { AiNarrativeSection } from "./_components/ai-narrative-section";
import { AiDocsSection } from "./_components/ai-docs-section";

type Tab = "analysis" | "documents" | "activity";

const TABS: { key: Tab; label: string }[] = [
  { key: "analysis", label: "Analysis" },
  { key: "documents", label: "Documents" },
  { key: "activity", label: "Activity" },
];

const DOC_CATALOG: { type: DocType; title: string }[] = [
  { type: "offer-letter", title: "Letter of Intent" },
  { type: "psa", title: "Purchase & Sale Agreement" },
  { type: "assignment", title: "Assignment of Contract" },
];

const STATUS_TONE: Record<DealStatus, string> = {
  prospect: "bg-brass-50 text-brass-700 border-brass-100",
  contract: "bg-forest-50 text-forest-700 border-forest-200",
  closed: "bg-ink text-bone border-ink",
};

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { get, updateStatus, remove } = useDeals();
  const [tab, setTab] = React.useState<Tab>("analysis");

  const deal = get(id);

  if (!deal) {
    return (
      <div className="py-16">
        <Container>
          <SectionLabel>404 · Ledger</SectionLabel>
          <h1 className="font-display text-4xl text-ink mt-2 mb-2 tracking-tight">
            Deal not on the desk.
          </h1>
          <p className="text-ink-soft mb-6">
            This ledger entry was removed or drafted on another browser.
          </p>
          <Link href="/app">
            <Button variant="primary">Back to pipeline</Button>
          </Link>
        </Container>
      </div>
    );
  }

  const d = deal.draft;
  const addr = d.propertyAddress
    ? `${d.propertyAddress}${d.propertyCity ? `, ${d.propertyCity}` : ""}${d.propertyZip ? ` ${d.propertyZip}` : ""}`
    : "Untitled deal";

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-ink-faint hover:text-ink transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Pipeline
          </Link>
          <span className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em]">
            {deal.id}
          </span>
        </div>

        <header className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-10">
          <div>
            <SectionLabel>
              {d.state ?? "??"} · {d.strategy?.toUpperCase() ?? "—"} · Updated{" "}
              {new Date(deal.updatedAt).toLocaleDateString()}
            </SectionLabel>
            <h1 className="font-display text-4xl sm:text-5xl text-ink mt-2 leading-[1.05] tracking-tight">
              {addr}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span
                className={cn(
                  "px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-medium rounded-[3px] border",
                  STATUS_TONE[deal.status],
                )}
              >
                {deal.status === "prospect"
                  ? "Prospect"
                  : deal.status === "contract"
                    ? "Under contract"
                    : "Closed"}
              </span>
              {deal.analysis && (
                <Badge
                  tone={
                    deal.analysis.decision === "pursue"
                      ? "forest"
                      : deal.analysis.decision === "review"
                        ? "brass"
                        : "clay"
                  }
                >
                  {deal.analysis.decision}
                </Badge>
              )}
              {d.askingPriceCents != null && (
                <span className="text-sm text-ink-soft tabular-nums font-mono">
                  ask {formatCurrency(d.askingPriceCents)}
                </span>
              )}
              {d.arvCents != null && (
                <span className="text-sm text-ink-faint tabular-nums font-mono">
                  arv {formatCurrency(d.arvCents)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {deal.status !== "closed" && (
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  updateStatus(
                    deal.id,
                    deal.status === "prospect" ? "contract" : "closed",
                  )
                }
              >
                {deal.status === "prospect" ? "Mark under contract" : "Mark closed"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                if (confirm("Remove this deal from the ledger?")) {
                  remove(deal.id);
                  window.location.href = "/app";
                }
              }}
            >
              Remove
            </Button>
          </div>
        </header>

        <nav
          className="flex items-center gap-1 border-b border-rule mb-8"
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-forest-700 text-ink"
                  : "border-transparent text-ink-faint hover:text-ink-soft",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "analysis" && <AnalysisTab deal={deal} />}
        {tab === "documents" && <DocumentsTab deal={deal} />}
        {tab === "activity" && <ActivityTab deal={deal} />}
      </Container>
    </div>
  );
}

function AnalysisTab({ deal }: { deal: SavedDeal }) {
  const a = deal.analysis;
  const c = deal.compliance;
  const d = deal.draft;

  if (!a) {
    return (
      <div className="rounded-[10px] border border-rule bg-parchment p-8 text-center">
        <p className="text-ink-soft">
          No analysis saved. Re-run the wizard to refresh numbers.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AiNarrativeSection deal={deal} />

      <div className="grid md:grid-cols-4 gap-3">
        <StatCard
          label="Decision"
          value={a.decision.toUpperCase()}
          mono
          tone={a.decision === "pursue" ? "good" : a.decision === "pass" ? "bad" : undefined}
        />
        <StatCard
          label="Repair tier"
          value={a.repair.tier.toUpperCase()}
          sub={`${formatCurrency(a.repair.lowCents)} - ${formatCurrency(a.repair.highCents)}`}
          mono
        />
        {a.wholesale && (
          <>
            <StatCard
              label="MAO"
              value={formatCurrency(a.wholesale.maoCents)}
              mono
            />
            <StatCard
              label="Spread"
              value={formatCurrency(a.wholesale.profitSpreadCents)}
              mono
              tone={a.wholesale.profitSpreadCents >= 0 ? "good" : "bad"}
            />
          </>
        )}
        {a.flip && (
          <>
            <StatCard
              label="Net profit"
              value={formatCurrency(a.flip.netProfitCents)}
              mono
              tone={a.flip.netProfitCents > 0 ? "good" : "bad"}
            />
            <StatCard
              label="Margin"
              value={`${(a.flip.netMarginPct * 100).toFixed(1)}%`}
              mono
              tone={a.flip.netMarginPct >= 0.15 ? "good" : "bad"}
            />
          </>
        )}
        {a.hold && (
          <>
            <StatCard
              label="Cap rate"
              value={`${(a.hold.capRatePct * 100).toFixed(2)}%`}
              mono
              tone={a.hold.capRatePct >= 0.08 ? "good" : "bad"}
            />
            <StatCard
              label="Cashflow"
              value={formatCurrency(a.hold.monthlyCashFlowCents) + "/mo"}
              mono
              tone={a.hold.monthlyCashFlowCents > 0 ? "good" : "bad"}
            />
          </>
        )}
      </div>

      {a.reasons.length > 0 && (
        <section className="rounded-[10px] border border-rule bg-parchment p-5">
          <h3 className="font-display text-xl text-ink mb-3">Reasons</h3>
          <ul className="grid gap-1.5 text-sm text-ink-soft">
            {a.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 block w-1 h-1 rounded-full bg-brass-500" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.flags.length > 0 && (
        <section className="rounded-[10px] border border-rule bg-parchment p-5">
          <h3 className="font-display text-xl text-ink mb-3">Flags</h3>
          <ul className="grid gap-2 text-sm">
            {a.flags.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge tone={f.severity === "hard" ? "clay" : "brass"}>
                  {f.severity}
                </Badge>
                <span className="text-ink-soft">{f.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {c && (
        <section className="rounded-[10px] border border-rule bg-parchment p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xl text-ink">
              {c.ruleSet.stateName} compliance
            </h3>
            <Badge tone="forest">{c.recommendedFlow.replace("-", " ")}</Badge>
          </div>
          <ul className="grid gap-2 text-sm">
            {c.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge
                  tone={
                    w.severity === "block"
                      ? "clay"
                      : w.severity === "warn"
                        ? "brass"
                        : "forest"
                  }
                >
                  {w.severity}
                </Badge>
                <div>
                  <p className="text-ink font-medium">{w.title}</p>
                  <p className="text-ink-soft">{w.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[10px] border border-rule bg-parchment p-5">
        <h3 className="font-display text-xl text-ink mb-3">Property</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Dl label="Sqft" value={d.sqft?.toLocaleString() ?? "—"} />
          <Dl label="Beds" value={String(d.beds ?? "—")} />
          <Dl label="Baths" value={String(d.baths ?? "—")} />
          <Dl label="Year" value={String(d.yearBuilt ?? "—")} />
          <Dl label="Condition" value={`${d.conditionRating ?? "—"} / 5`} />
          <Dl label="Occupancy" value={d.occupancy ?? "—"} />
          <Dl label="Motivation" value={`${d.sellerMotivation ?? "—"} / 5`} />
          <Dl label="Urgency" value={d.timelineUrgencyDays ? `${d.timelineUrgencyDays}d` : "—"} />
        </dl>
        {d.repairNotes && (
          <>
            <div className="mt-4 text-[11px] uppercase tracking-[0.14em] text-brass-700 font-medium">
              Walkthrough notes
            </div>
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">
              {d.repairNotes}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function DocumentsTab({ deal }: { deal: SavedDeal }) {
  const d = deal.draft;
  const [docId] = React.useState(() => deal.id.replace(/^WS-/, "WS-"));
  const [selected, setSelected] = React.useState<DocType>("psa");

  const vars: DocumentVariables | null = React.useMemo(() => {
    if (
      !d.state ||
      !d.strategy ||
      !d.propertyAddress ||
      !d.propertyCity ||
      !d.propertyZip ||
      d.askingPriceCents == null
    ) {
      return null;
    }
    const stateName =
      SUPPORTED_STATES.find((s) => s.code === d.state)?.name ?? d.state;
    return {
      state: d.state,
      stateName,
      strategy: d.strategy,
      buyer: { name: d.buyerName || "[Buyer name]", entity: d.buyerEntity },
      seller: { name: d.sellerName || "[Seller name]" },
      property: {
        address: d.propertyAddress,
        city: d.propertyCity,
        county: d.propertyCounty,
        zip: d.propertyZip,
        sqft: d.sqft,
        beds: d.beds,
        baths: d.baths,
        yearBuilt: d.yearBuilt,
      },
      terms: {
        purchasePriceCents: d.askingPriceCents,
        earnestMoneyCents: Math.max(100000, Math.round(d.askingPriceCents * 0.01)),
        earnestMoneyHolder: "the escrow agent agreed by the parties",
        closingDate: "[closing date]",
        offerExpirationDate: "[date]",
        inspectionPeriodDays: 10,
        assignmentFeeCents: d.assignmentFeeCents,
      },
      meta: {
        documentId: docId,
        executionDate: new Date(deal.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        templateVersion: "2026.Q1",
        ruleSnapshotId: `${d.state}_2026_Q1`,
      },
    };
  }, [d, docId, deal.createdAt]);

  const rendered = React.useMemo(() => {
    if (!vars) return null;
    try {
      return renderDocument(selected, vars);
    } catch {
      return null;
    }
  }, [vars, selected]);

  if (!vars) {
    return (
      <div className="rounded-[10px] border border-rule bg-parchment p-8 text-center">
        <p className="text-ink-soft">
          Deal is missing required fields. Open the wizard to finish it.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AiDocsSection deal={deal} />

      <div className="grid gap-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-mono font-medium">
          Starter templates
        </div>
      <div className="flex flex-wrap gap-2 items-center">
        {DOC_CATALOG.map((doc) => {
          const active = selected === doc.type;
          const available = doc.type !== "assignment" || d.strategy === "wholesale";
          return (
            <button
              key={doc.type}
              type="button"
              disabled={!available}
              onClick={() => setSelected(doc.type)}
              className={cn(
                "px-4 py-2 rounded-[6px] text-sm font-medium border transition-colors",
                active
                  ? "bg-forest-900 text-bone border-forest-900"
                  : "bg-parchment border-rule text-ink hover:border-forest-200",
                !available && "opacity-40 cursor-not-allowed",
              )}
            >
              {doc.title}
            </button>
          );
        })}
        <div className="ml-auto flex gap-2">
          <a
            href={`/print/${selected}?deal=${deal.id}`}
            target="_blank"
            rel="noopener"
          >
            <Button variant="primary" size="sm" disabled={!rendered}>
              Download PDF
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-[10px] border border-rule bg-parchment overflow-hidden">
        <div className="border-b border-rule px-5 py-3 flex items-center justify-between bg-forest-900 text-bone">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass-300">
              Draft preview
            </span>
            <span className="text-sm font-medium">
              {DOC_CATALOG.find((doc) => doc.type === selected)?.title}
            </span>
          </div>
          {rendered && (
            <Badge tone="brass" className="bg-white/10 border-transparent text-bone/90">
              {rendered.variables.meta.documentId}
            </Badge>
          )}
        </div>
        {rendered ? (
          <article className="px-6 sm:px-10 py-8 max-h-[620px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink font-display tracking-tight">
              {rendered.bodyMarkdown}
            </pre>
            <div className="mt-10 pt-5 border-t border-dashed border-rule">
              <p className="text-[11px] uppercase tracking-[0.16em] text-brass-700 font-medium mb-2">
                Attorney review notice
              </p>
              <p className="text-xs text-ink-soft italic leading-relaxed">
                {rendered.disclaimer}
              </p>
            </div>
          </article>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-ink-faint">
            Could not render this document.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function ActivityTab({ deal }: { deal: SavedDeal }) {
  const events = [
    {
      at: deal.createdAt,
      label: "Deal drafted",
      sub: "Wizard completed. Analysis computed.",
    },
    {
      at: deal.updatedAt,
      label: deal.status === "closed" ? "Marked closed" : deal.status === "contract" ? "Advanced to contract" : "Last edited",
      sub: "Status updated.",
    },
  ];

  return (
    <div className="rounded-[10px] border border-rule bg-parchment p-6">
      <h3 className="font-display text-xl text-ink mb-4">Audit log</h3>
      <ol className="relative border-l border-rule pl-5 space-y-5">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <span
              aria-hidden
              className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-brass-500 border-2 border-parchment"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink font-medium">{e.label}</span>
              <span className="text-[11px] text-ink-faint font-mono uppercase tracking-[0.12em]">
                {new Date(e.at).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">{e.sub}</p>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-ink-faint mt-6">
        Full audit log (document downloads, e-sign events, pipeline moves) ships with
        server persistence.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  mono,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border p-4 bg-parchment",
        tone === "good" && "border-forest-200",
        tone === "bad" && "border-[#e8c9bc]",
        !tone && "border-rule",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-xl mt-1",
          mono ? "font-mono tabular-nums" : "font-display",
          tone === "good" && "text-forest-700",
          tone === "bad" && "text-clay-600",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-faint mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function Dl({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-sm text-ink mt-1 font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
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
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}
