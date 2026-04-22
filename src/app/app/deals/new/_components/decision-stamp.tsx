"use client";

import { cn } from "@/lib/utils";
import type { DecisionScore } from "@/lib/analysis/types";

const COPY: Record<DecisionScore, { label: string; sub: string; className: string }> = {
  pursue: {
    label: "Pursue",
    sub: "Numbers clear the thresholds. No hard flags.",
    className:
      "bg-forest-900 text-bone border-forest-900 shadow-[0_20px_50px_-20px_rgba(26,58,46,0.5)]",
  },
  review: {
    label: "Review",
    sub: "Borderline or soft flags present. Underwrite manually.",
    className:
      "bg-[#fff4d6] text-brass-700 border-brass-300 shadow-[0_20px_50px_-20px_rgba(176,141,87,0.35)]",
  },
  pass: {
    label: "Pass",
    sub: "Hard flag or the math does not support this deal.",
    className:
      "bg-[#f4e0d8] text-clay-600 border-[#e8c9bc] shadow-[0_20px_50px_-20px_rgba(180,92,74,0.3)]",
  },
};

export function DecisionStamp({
  decision,
  reasons,
}: {
  decision: DecisionScore;
  reasons: string[];
}) {
  const copy = COPY[decision];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] border-2 p-6 sm:p-8",
        copy.className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] font-medium opacity-70 mb-2">
            Decision
          </div>
          <h2 className="font-display text-5xl sm:text-6xl leading-none">
            {copy.label}
          </h2>
          <p className="mt-3 text-sm opacity-80 max-w-md">{copy.sub}</p>
        </div>
        <svg
          className="w-24 h-24 opacity-20 sm:opacity-30"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden
        >
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            style={{ fontFamily: "Fraunces, serif", letterSpacing: "0.1em" }}
          >
            WHOLESAIL
          </text>
        </svg>
      </div>
      {reasons.length > 0 && (
        <ul className="mt-6 grid gap-1.5 text-sm opacity-90">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 block w-1 h-1 rounded-full bg-current opacity-60" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
