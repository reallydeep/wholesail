"use client";

import { cn } from "@/lib/utils";
import type { Strategy } from "@/lib/analysis/types";
import { STRATEGY_COPY, type DealDraft } from "../_lib/types";

const ORDER: Strategy[] = ["wholesale", "flip", "hold"];

export function StepStrategy({
  draft,
  onChange,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ORDER.map((s) => {
        const copy = STRATEGY_COPY[s];
        const selected = draft.strategy === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ strategy: s })}
            className={cn(
              "text-left p-6 rounded-[10px] border transition-all group",
              "shadow-[0_1px_0_rgba(26,31,26,0.03)]",
              selected
                ? "bg-forest-900 text-bone border-forest-900 shadow-[0_10px_30px_-10px_rgba(26,58,46,0.35)]"
                : "bg-parchment border-rule hover:border-forest-200 hover:-translate-y-0.5",
            )}
          >
            <div
              className={cn(
                "text-[11px] uppercase tracking-[0.16em] font-medium mb-3",
                selected ? "text-brass-300" : "text-brass-700",
              )}
            >
              Strategy · {String(ORDER.indexOf(s) + 1).padStart(2, "0")}
            </div>
            <h3
              className={cn(
                "font-display text-3xl leading-tight mb-2",
                selected ? "text-bone" : "text-ink",
              )}
            >
              {copy.label}
            </h3>
            <p
              className={cn(
                "text-sm mb-4",
                selected ? "text-bone/80" : "text-ink-soft",
              )}
            >
              {copy.sub}
            </p>
            <div
              className={cn(
                "font-mono text-xs px-2.5 py-1.5 rounded-[4px] inline-block",
                selected
                  ? "bg-white/10 text-bone"
                  : "bg-bone-deep text-ink-soft border border-rule",
              )}
            >
              {copy.line}
            </div>
          </button>
        );
      })}
    </div>
  );
}
