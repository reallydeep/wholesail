"use client";

import * as React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { ComplianceDecision } from "@/lib/compliance/types";
import type { DealDraft } from "../_lib/types";
import { DecisionStamp } from "./decision-stamp";
import { buildSnapshot } from "@/lib/ai/snapshot";
import { useAiNarrative } from "@/lib/ai/use-ai";
import type { AiAnalysisNarrative } from "@/lib/ai/types";

type StageState = "pending" | "active" | "done";

interface Stage {
  id: string;
  label: string;
  hint: string;
}

const STAGES: Stage[] = [
  { id: "repair", label: "Estimating repair band", hint: "Parsing remarks · matching keyword tiers" },
  { id: "mao", label: "Running the math", hint: "MAO · spread · margin · cap rate" },
  { id: "flags", label: "Scanning for deal killers", hint: "Title terms · thin margin · occupancy" },
  { id: "compliance", label: "Checking state compliance", hint: "Rule-set merge · warning severity" },
  { id: "ai", label: "Reading the deal with Claude", hint: "Unvarnished second opinion" },
];

export function StepAnalyze({
  draft,
  analysis,
  compliance,
  error,
}: {
  draft: DealDraft;
  analysis?: AnalysisResult;
  compliance?: ComplianceDecision;
  error?: string;
}) {
  const snapshot = React.useMemo(
    () => (analysis ? buildSnapshot(draft, analysis) : null),
    [draft, analysis],
  );

  const { data: ai, loading: aiLoading, error: aiError, refresh } = useAiNarrative(snapshot, {
    eager: true,
  });

  const [activeIdx, setActiveIdx] = React.useState(0);
  const runKey = `${snapshot?.address ?? ""}|${snapshot?.askingPriceCents ?? ""}|${snapshot?.arvCents ?? ""}`;

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setActiveIdx(0), 0));
    for (let i = 1; i <= 3; i++) {
      timers.push(setTimeout(() => setActiveIdx(i), 400 * i));
    }
    timers.push(setTimeout(() => setActiveIdx(4), 1600));
    return () => timers.forEach(clearTimeout);
  }, [runKey]);

  // once AI resolves (or errors → fallback also resolves), mark stage 4 done
  const stageStates: StageState[] = STAGES.map((_, i) => {
    if (i < 4) return i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
    if (aiLoading) return activeIdx === 4 ? "active" : "pending";
    if (!ai && !aiError) return "pending";
    return "done";
  });

  const deterministicReady = stageStates.slice(0, 4).every((s) => s === "done");

  if (error || !analysis) {
    return (
      <div className="rounded-[10px] border-2 border-clay-600/30 bg-[#f4e0d8] p-6">
        <p className="text-clay-600 font-medium">Analysis unavailable</p>
        <p className="text-sm text-ink-soft mt-1">
          {error ?? "Go back and complete the wizard."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <StageRail stages={STAGES} states={stageStates} />

      {!deterministicReady ? (
        <ScanPane />
      ) : (
        <>
          <div className="stagger-in-1">
            <DecisionStamp decision={analysis.decision} reasons={analysis.reasons} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              <KpiCard
                key="repair"
                label="Repair band"
                value={`${formatCurrency(analysis.repair.lowCents)} — ${formatCurrency(analysis.repair.highCents)}`}
                sub={`${analysis.repair.tier.toUpperCase()} tier · mid ${formatCurrency(analysis.repair.midCents)}`}
              />,
              analysis.wholesale && (
                <KpiCard
                  key="mao"
                  label="MAO"
                  value={formatCurrency(analysis.wholesale.maoCents)}
                  sub={`${(analysis.wholesale.multiplierUsed * 100).toFixed(0)}% rule`}
                />
              ),
              analysis.wholesale && (
                <KpiCard
                  key="spread"
                  label="Spread"
                  value={formatCurrency(analysis.wholesale.profitSpreadCents)}
                  sub="MAO − asking"
                  tone={analysis.wholesale.profitSpreadCents >= 0 ? "good" : "bad"}
                />
              ),
              analysis.flip && (
                <KpiCard
                  key="net"
                  label="Net profit"
                  value={formatCurrency(analysis.flip.netProfitCents)}
                  sub="After holding + selling"
                  tone={analysis.flip.netProfitCents > 0 ? "good" : "bad"}
                />
              ),
              analysis.flip && (
                <KpiCard
                  key="margin"
                  label="Net margin"
                  value={`${(analysis.flip.netMarginPct * 100).toFixed(1)}%`}
                  sub="of ARV"
                  tone={analysis.flip.netMarginPct >= 0.15 ? "good" : "bad"}
                />
              ),
              analysis.hold && (
                <KpiCard
                  key="cap"
                  label="Cap rate"
                  value={`${(analysis.hold.capRatePct * 100).toFixed(2)}%`}
                  sub={`NOI ${formatCurrency(analysis.hold.noiAnnualCents)}/yr`}
                  tone={analysis.hold.capRatePct >= 0.08 ? "good" : "bad"}
                />
              ),
              analysis.hold && (
                <KpiCard
                  key="cash"
                  label="Cashflow"
                  value={`${formatCurrency(analysis.hold.monthlyCashFlowCents)}/mo`}
                  sub={`${(analysis.hold.cashOnCashPct * 100).toFixed(1)}% CoC`}
                  tone={analysis.hold.monthlyCashFlowCents > 0 ? "good" : "bad"}
                />
              ),
            ]
              .filter(Boolean)
              .map((node, i) => (
                <div key={(node as React.ReactElement).key ?? i} className={`stagger-in-${Math.min(i + 2, 6)}`}>
                  {node}
                </div>
              ))}
          </div>

          {analysis.flags.length > 0 && (
            <div className="rounded-[10px] border border-rule bg-parchment p-5 stagger-in-5">
              <h4 className="font-display text-lg text-ink mb-3">Flags</h4>
              <ul className="grid gap-2">
                {analysis.flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Badge tone={f.severity === "hard" ? "clay" : "brass"}>
                      {f.severity}
                    </Badge>
                    <span className="text-ink-soft">{f.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {compliance && (
            <div className="rounded-[10px] border border-rule bg-parchment p-5 stagger-in-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-lg text-ink">
                  {compliance.ruleSet.stateName} compliance
                </h4>
                <Badge tone="forest">
                  {compliance.recommendedFlow.replace("-", " ")}
                </Badge>
              </div>
              <ul className="grid gap-2 text-sm">
                {compliance.warnings.map((w, i) => (
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
            </div>
          )}

          <AiNarrativeCard data={ai} loading={aiLoading} error={aiError} onRefresh={refresh} />
        </>
      )}
    </div>
  );
}

function StageRail({ stages, states }: { stages: Stage[]; states: StageState[] }) {
  return (
    <div className="rounded-[10px] border border-rule bg-parchment p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-mono font-medium">
          Analysis engine
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint font-mono tabular-nums">
          {states.filter((s) => s === "done").length} / {stages.length}
        </div>
      </div>
      <ol className="grid gap-2">
        {stages.map((s, i) => (
          <StageRow key={s.id} stage={s} state={states[i]} />
        ))}
      </ol>
    </div>
  );
}

function StageRow({ stage, state }: { stage: Stage; state: StageState }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-[6px] border transition-colors",
        state === "done" && "border-forest-200 bg-forest-50",
        state === "active" && "border-brass-100 bg-brass-50",
        state === "pending" && "border-rule bg-parchment",
      )}
    >
      <StageIcon state={state} />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm",
            state === "pending" ? "text-ink-faint" : "text-ink",
          )}
        >
          {stage.label}
        </div>
        <div className="text-[11px] text-ink-faint">{stage.hint}</div>
      </div>
      {state === "active" && (
        <div className="relative h-[3px] w-28 rounded-full bg-brass-100 overflow-hidden">
          <div className="shimmer-bar absolute inset-0" />
        </div>
      )}
      {state === "done" && (
        <span className="text-[10px] uppercase tracking-[0.14em] text-forest-700 font-mono font-medium">
          Done
        </span>
      )}
    </li>
  );
}

function StageIcon({ state }: { state: StageState }) {
  if (state === "done") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-forest-700 text-bone animate-tick-in">
        <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-brass-500 relative">
        <span className="w-2 h-2 rounded-full bg-brass-500 animate-pulse-dot" />
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-rule">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint/50" />
    </span>
  );
}

function ScanPane() {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-rule bg-parchment p-10 text-center scan-sweep">
      <div className="text-[10px] uppercase tracking-[0.2em] text-brass-700 font-mono font-medium">
        Running the engine
      </div>
      <p className="font-display text-2xl text-ink mt-3 max-w-md mx-auto leading-snug">
        The ledger is thinking. Numbers are being stamped.
      </p>
      <p className="text-xs text-ink-faint mt-2 max-w-sm mx-auto">
        This is pure local math — zero server round-trips until we pull Claude in for the narrative read.
      </p>
    </div>
  );
}

function AiNarrativeCard({
  data,
  loading,
  error,
  onRefresh,
}: {
  data: AiAnalysisNarrative | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-[10px] border border-rule bg-forest-900 text-bone p-6 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brass-300 font-mono font-medium">
            Claude&rsquo;s read
          </span>
          {data?.source === "ai" && (
            <Badge tone="brass" className="bg-brass-500/20 text-brass-300 border-brass-300/20">
              Live AI
            </Badge>
          )}
          {data?.source === "deterministic" && (
            <Badge tone="neutral" className="bg-white/10 text-bone/70 border-transparent">
              Template · connect ANTHROPIC_API_KEY for live
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-[10px] uppercase tracking-[0.16em] text-brass-300/80 hover:text-brass-300 font-mono font-medium disabled:opacity-40"
        >
          {loading ? "Reading…" : "Refresh"}
        </button>
      </div>

      {loading && !data && (
        <div className="grid gap-3">
          <div className="h-3 shimmer-bar rounded-full w-3/4" />
          <div className="h-3 shimmer-bar rounded-full w-5/6" />
          <div className="h-3 shimmer-bar rounded-full w-2/3" />
          <div className="mt-4 grid gap-2">
            <div className="h-2.5 shimmer-bar rounded-full w-1/2" />
            <div className="h-2.5 shimmer-bar rounded-full w-4/5" />
          </div>
        </div>
      )}

      {error && !data && (
        <p className="text-sm text-clay-400">
          AI read failed. <button className="underline" onClick={onRefresh}>Try again</button>
        </p>
      )}

      {data && (
        <div className="grid gap-5 stagger-in-1">
          <div>
            <h3 className="font-display text-3xl leading-tight tracking-tight">
              {data.headline}
            </h3>
            <p className="text-sm text-bone/70 mt-2 leading-relaxed max-w-2xl">
              {data.thesis}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <NarrativeColumn label="Opportunities" items={data.opportunities} tone="forest" />
            <NarrativeColumn label="Risks" items={data.risks} tone="clay" />
            <NarrativeColumn label="Negotiation" items={data.negotiation} tone="brass" />
          </div>
          <p className="text-[10px] text-bone/40 font-mono uppercase tracking-[0.14em]">
            Generated {new Date(data.generatedAt).toLocaleString()} · hash {data.inputHash}
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

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border p-5 bg-parchment",
        tone === "good" && "border-forest-200",
        tone === "bad" && "border-[#e8c9bc]",
        !tone && "border-rule",
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] text-brass-700 font-medium">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-2xl mt-1.5 tabular-nums",
          tone === "good" && "text-forest-700",
          tone === "bad" && "text-clay-600",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-ink-faint mt-1">{sub}</div>}
    </div>
  );
}
