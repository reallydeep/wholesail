"use client";

import { cn } from "@/lib/utils";
import { STEP_LABELS, STEP_ORDER, type WizardStep } from "../_lib/types";

export function WizardProgress({ current }: { current: WizardStep }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  return (
    <ol className="flex items-center gap-1 w-full" aria-label="Wizard progress">
      {STEP_ORDER.map((step, idx) => {
        const state =
          idx < currentIdx ? "done" : idx === currentIdx ? "active" : "upcoming";
        return (
          <li key={step} className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium tabular-nums transition-colors",
                  state === "done" && "bg-forest-700 text-bone",
                  state === "active" &&
                    "bg-brass-500 text-ink ring-2 ring-brass-300/40",
                  state === "upcoming" && "bg-bone-deep text-ink-faint border border-rule",
                )}
              >
                {state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden sm:inline text-xs uppercase tracking-[0.12em] truncate",
                  state === "active" && "text-ink font-medium",
                  state === "done" && "text-ink-soft",
                  state === "upcoming" && "text-ink-faint",
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {idx < STEP_ORDER.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "flex-1 h-px",
                  idx < currentIdx ? "bg-forest-600" : "bg-rule",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
