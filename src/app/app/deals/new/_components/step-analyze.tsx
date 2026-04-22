"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { ComplianceDecision } from "@/lib/compliance/types";
import { DecisionStamp } from "./decision-stamp";

export function StepAnalyze({
  analysis,
  compliance,
  error,
}: {
  analysis?: AnalysisResult;
  compliance?: ComplianceDecision;
  error?: string;
}) {
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
      <DecisionStamp decision={analysis.decision} reasons={analysis.reasons} />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Repair band"
          value={`${formatCurrency(analysis.repair.lowCents)} — ${formatCurrency(analysis.repair.highCents)}`}
          sub={`${analysis.repair.tier.toUpperCase()} tier · mid ${formatCurrency(analysis.repair.midCents)}`}
        />
        {analysis.wholesale && (
          <>
            <KpiCard
              label="MAO"
              value={formatCurrency(analysis.wholesale.maoCents)}
              sub={`${(analysis.wholesale.multiplierUsed * 100).toFixed(0)}% rule`}
            />
            <KpiCard
              label="Spread"
              value={formatCurrency(analysis.wholesale.profitSpreadCents)}
              sub="MAO − asking"
              tone={analysis.wholesale.profitSpreadCents >= 0 ? "good" : "bad"}
            />
          </>
        )}
        {analysis.flip && (
          <>
            <KpiCard
              label="Net profit"
              value={formatCurrency(analysis.flip.netProfitCents)}
              sub="After holding + selling"
              tone={analysis.flip.netProfitCents > 0 ? "good" : "bad"}
            />
            <KpiCard
              label="Net margin"
              value={`${(analysis.flip.netMarginPct * 100).toFixed(1)}%`}
              sub="of ARV"
              tone={analysis.flip.netMarginPct >= 0.15 ? "good" : "bad"}
            />
          </>
        )}
        {analysis.hold && (
          <>
            <KpiCard
              label="Cap rate"
              value={`${(analysis.hold.capRatePct * 100).toFixed(2)}%`}
              sub={`NOI ${formatCurrency(analysis.hold.noiAnnualCents)}/yr`}
              tone={analysis.hold.capRatePct >= 0.08 ? "good" : "bad"}
            />
            <KpiCard
              label="Cashflow"
              value={`${formatCurrency(analysis.hold.monthlyCashFlowCents)}/mo`}
              sub={`${(analysis.hold.cashOnCashPct * 100).toFixed(1)}% CoC`}
              tone={analysis.hold.monthlyCashFlowCents > 0 ? "good" : "bad"}
            />
          </>
        )}
      </div>

      {analysis.flags.length > 0 && (
        <div className="rounded-[10px] border border-rule bg-parchment p-5">
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
        <div className="rounded-[10px] border border-rule bg-parchment p-5">
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
