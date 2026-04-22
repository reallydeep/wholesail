"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "./field";
import { renderDocument } from "@/lib/templates/render";
import { SUPPORTED_STATES } from "@/lib/compliance";
import { formatCurrency, cn } from "@/lib/utils";
import { useDeals } from "@/lib/deals/store";
import type { DocType, DocumentVariables } from "@/lib/templates/types";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { ComplianceDecision } from "@/lib/compliance/types";
import type { DealDraft } from "../_lib/types";

const DOC_CATALOG: { type: DocType; title: string; sub: string }[] = [
  { type: "offer-letter", title: "Letter of Intent", sub: "Non-binding offer to start the conversation." },
  { type: "psa", title: "Purchase & Sale Agreement", sub: "Binding contract with full state-specific clauses." },
  { type: "assignment", title: "Assignment of Contract", sub: "Transfer your PSA rights to the end-buyer." },
];

function buildVars(draft: DealDraft, docId: string): DocumentVariables | null {
  if (!draft.state || !draft.strategy || !draft.propertyAddress || !draft.propertyCity || !draft.propertyZip || draft.askingPriceCents == null) {
    return null;
  }
  const stateName = SUPPORTED_STATES.find((s) => s.code === draft.state)?.name ?? draft.state;
  return {
    state: draft.state,
    stateName,
    strategy: draft.strategy,
    buyer: {
      name: draft.buyerName || "[Buyer name]",
      entity: draft.buyerEntity,
    },
    seller: { name: draft.sellerName || "[Seller name]" },
    property: {
      address: draft.propertyAddress,
      city: draft.propertyCity,
      county: draft.propertyCounty,
      zip: draft.propertyZip,
      sqft: draft.sqft,
      beds: draft.beds,
      baths: draft.baths,
      yearBuilt: draft.yearBuilt,
    },
    terms: {
      purchasePriceCents: draft.askingPriceCents,
      earnestMoneyCents: Math.max(100000, Math.round(draft.askingPriceCents * 0.01)),
      earnestMoneyHolder: "the escrow agent agreed by the parties",
      closingDate: "[closing date]",
      offerExpirationDate: "[date]",
      inspectionPeriodDays: 10,
      assignmentFeeCents: draft.assignmentFeeCents,
    },
    meta: {
      documentId: docId,
      executionDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      templateVersion: "2026.Q1",
      ruleSnapshotId: `${draft.state}_2026_Q1`,
    },
  };
}

export function StepReview({
  draft,
  onChange,
  analysis,
  compliance,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
  analysis?: AnalysisResult;
  compliance?: ComplianceDecision;
}) {
  const [docId] = React.useState(
    () => `WS-${Math.floor(10000 + Math.random() * 89999)}`,
  );
  const [selected, setSelected] = React.useState<DocType>("psa");
  const { save } = useDeals();
  const router = useRouter();
  const [saved, setSaved] = React.useState(false);
  const vars = React.useMemo(() => buildVars(draft, docId), [draft, docId]);
  const rendered = React.useMemo(() => {
    if (!vars) return null;
    try {
      return renderDocument(selected, vars);
    } catch {
      return null;
    }
  }, [vars, selected]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <aside className="grid gap-5">
        <section className="rounded-[10px] border border-rule bg-parchment p-5">
          <h4 className="font-display text-xl text-ink mb-3">Parties</h4>
          <div className="grid gap-3">
            <TextField
              label="Buyer name"
              placeholder="Your name"
              value={draft.buyerName ?? ""}
              onChange={(e) => onChange({ buyerName: e.target.value })}
            />
            <TextField
              label="Buyer entity (optional)"
              placeholder="XYZ Investments, LLC"
              value={draft.buyerEntity ?? ""}
              onChange={(e) => onChange({ buyerEntity: e.target.value })}
            />
            <TextField
              label="Seller name"
              placeholder="From the deed"
              value={draft.sellerName ?? ""}
              onChange={(e) => onChange({ sellerName: e.target.value })}
            />
          </div>
        </section>

        <section className="rounded-[10px] border border-rule bg-parchment p-5">
          <h4 className="font-display text-xl text-ink mb-3">Deal snapshot</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Strategy" value={draft.strategy?.toUpperCase() ?? "—"} />
            <Row label="State" value={draft.state ?? "—"} />
            <Row label="Asking" value={draft.askingPriceCents != null ? formatCurrency(draft.askingPriceCents) : "—"} />
            <Row label="ARV" value={draft.arvCents != null ? formatCurrency(draft.arvCents) : "—"} />
            {analysis && (
              <Row label="Decision" value={analysis.decision.toUpperCase()} mono />
            )}
          </dl>
        </section>

        {compliance && compliance.warnings.length > 0 && (
          <section className="rounded-[10px] border border-brass-100 bg-brass-50/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.3" className="text-brass-700" />
                <path d="M8 6V9M8 11V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-brass-700" />
              </svg>
              <h4 className="font-display text-lg text-ink">State overlay applied</h4>
            </div>
            <p className="text-xs text-ink-soft">
              {compliance.ruleSet.stateName} clauses are merged into every document you generate below.
            </p>
          </section>
        )}
      </aside>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {DOC_CATALOG.map((d) => {
            const active = selected === d.type;
            const available =
              d.type !== "assignment" || draft.strategy === "wholesale";
            return (
              <button
                key={d.type}
                type="button"
                disabled={!available}
                onClick={() => setSelected(d.type)}
                className={cn(
                  "px-4 py-2 rounded-[6px] text-sm font-medium border transition-colors",
                  active
                    ? "bg-forest-900 text-bone border-forest-900"
                    : "bg-parchment border-rule text-ink hover:border-forest-200",
                  !available && "opacity-40 cursor-not-allowed",
                )}
              >
                {d.title}
              </button>
            );
          })}
        </div>

        <div className="rounded-[10px] border border-rule bg-parchment overflow-hidden">
          <div className="border-b border-rule px-5 py-3 flex items-center justify-between bg-forest-900 text-bone">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass-300">
                Draft preview
              </span>
              <span className="text-sm font-medium">
                {DOC_CATALOG.find((d) => d.type === selected)?.title}
              </span>
            </div>
            {rendered && (
              <Badge tone="brass" className="bg-white/10 border-transparent text-bone/90">
                {rendered.variables.meta.documentId}
              </Badge>
            )}
          </div>
          {rendered ? (
            <article className="px-6 sm:px-10 py-8 max-h-[540px] overflow-y-auto bg-parchment">
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
              Fill in the required fields to preview a document.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={rendered ? `/print/${selected}` : undefined}
            target="_blank"
            rel="noopener"
            aria-disabled={!rendered}
            onClick={(e) => { if (!rendered) e.preventDefault(); }}
          >
            <Button variant="primary" size="lg" disabled={!rendered}>
              Download PDF
            </Button>
          </a>
          <Button variant="outline" size="lg" disabled={!rendered}>
            Send to e-sign
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {saved && (
              <span className="text-xs text-forest-700 font-medium uppercase tracking-[0.14em]">
                Saved
              </span>
            )}
            <Button
              variant="ghost"
              size="lg"
              disabled={!rendered || saved}
              onClick={() => {
                const deal = save({
                  draft,
                  analysis,
                  compliance,
                });
                setSaved(true);
                setTimeout(() => router.push(`/app/deals/${deal.id}`), 350);
              }}
            >
              Save to pipeline
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-ink-faint">
          Download opens a print-optimized page. Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; from the print dialog. E-sign wire-up lands later.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-ink-faint uppercase tracking-[0.12em] text-[10px] self-center">
        {label}
      </dt>
      <dd className={cn("text-ink text-right", mono && "font-mono tabular-nums")}>{value}</dd>
    </>
  );
}
