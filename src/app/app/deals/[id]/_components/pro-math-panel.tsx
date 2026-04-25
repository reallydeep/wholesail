"use client";

import * as React from "react";
import type { EngineResult } from "@/lib/math";

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function ProMathPanel({ result }: { result: EngineResult }) {
  const { wholesale, flip, hold, shared, stateFactors, sensitivity } = result;
  return (
    <div className="rounded-[12px] border border-rule bg-parchment/60 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.18em] text-ink-faint">
          Pro Math · v{result.engineVersion}
        </h3>
        {stateFactors.disclosureRequired && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-brass-700 border border-brass-300 rounded-full px-2 py-0.5">
            Disclosure required
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Col title="Wholesale">
          <Row label="MAO" value={fmtUsd(wholesale.mao)} />
          <Row label="Spread" value={fmtUsd(wholesale.spread)} />
          <Row
            label="Assignment fee"
            value={fmtUsd(wholesale.assignmentFeeUsed)}
          />
          <Row label="Equity to buyer" value={fmtUsd(wholesale.equityToBuyer)} />
        </Col>
        <Col title="Flip">
          <Row label="Net profit" value={fmtUsd(flip.netProfit)} />
          <Row label="Holding cost" value={fmtUsd(flip.holdingCost)} />
          <Row label="Annualized ROI" value={fmtPct(flip.annualizedRoi)} />
          <Row
            label="70% rule"
            value={flip.violatesSeventyRule ? "Violated" : "OK"}
          />
        </Col>
        <Col title="Hold / BRRRR">
          <Row label="Cash flow / mo" value={fmtUsd(hold.cashFlow / 12)} />
          <Row label="Cap rate" value={fmtPct(hold.capRate)} />
          <Row label="DSCR" value={hold.dscr.toFixed(2)} />
          <Row label="Refi out" value={fmtUsd(hold.brrrrRefiOut)} />
        </Col>
      </div>

      <div className="text-[11px] text-ink-faint border-t border-rule pt-3">
        Monthly PITI {fmtUsd(shared.monthlyPiti)} · Loan{" "}
        {fmtUsd(shared.loanAmount)} · Down {fmtUsd(shared.downPayment)}
      </div>

      <details className="pt-2">
        <summary className="text-[11px] uppercase tracking-[0.16em] text-ink-faint cursor-pointer hover:text-ink">
          Sensitivity · ARV ±10% × rehab ±20%
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[11px] font-mono tabular-nums">
            <thead>
              <tr className="text-ink-faint">
                <th className="text-left pb-2">ARV \ Rehab</th>
                {sensitivity[0].map((c) => (
                  <th key={c.rehabDelta} className="text-right pb-2 px-2">
                    {c.rehabDelta === 0
                      ? "base"
                      : `${c.rehabDelta > 0 ? "+" : ""}${(c.rehabDelta * 100).toFixed(0)}%`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={row[0].arvDelta} className="border-t border-rule/50">
                  <td className="py-1 text-ink-faint">
                    {row[0].arvDelta === 0
                      ? "base"
                      : `${row[0].arvDelta > 0 ? "+" : ""}${(row[0].arvDelta * 100).toFixed(0)}%`}
                  </td>
                  {row.map((c) => (
                    <td
                      key={c.rehabDelta}
                      className="text-right px-2 py-1 text-ink"
                    >
                      {fmtUsd(c.flip.netProfit)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-ink-faint mt-2">
            Table shows flip net profit under ARV/rehab perturbations.
          </p>
        </div>
      </details>
    </div>
  );
}

function Col({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {title}
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
        {children}
      </dl>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink font-mono tabular-nums text-right">{value}</dd>
    </>
  );
}
