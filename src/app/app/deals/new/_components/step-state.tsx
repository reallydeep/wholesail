"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_STATES, resolveRules } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";
import type { DealDraft } from "../_lib/types";

export function StepState({
  draft,
  onChange,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SUPPORTED_STATES.map(({ code, name }) => {
        const rules = resolveRules(code as StateCode);
        const selected = draft.state === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange({ state: code as StateCode })}
            className={cn(
              "flex flex-col text-left p-6 rounded-[10px] border transition-all",
              selected
                ? "bg-forest-900 text-bone border-forest-900"
                : "bg-parchment border-rule hover:border-forest-200 hover:-translate-y-0.5",
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={cn(
                  "font-mono text-2xl tabular-nums",
                  selected ? "text-brass-300" : "text-brass-700",
                )}
              >
                {code}
              </span>
              {rules?.confidence && (
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-[3px]",
                    selected
                      ? "bg-white/10 text-bone/90"
                      : rules.confidence === "high"
                        ? "bg-forest-50 text-forest-700 border border-forest-200"
                        : "bg-[#fff4d6] text-brass-700 border border-brass-100",
                  )}
                >
                  {rules.confidence} confidence
                </span>
              )}
            </div>
            <h3
              className={cn(
                "font-display text-2xl leading-tight mb-2",
                selected ? "text-bone" : "text-ink",
              )}
            >
              {name}
            </h3>
            {rules && (
              <ul
                className={cn(
                  "text-sm space-y-1.5 mt-1",
                  selected ? "text-bone/80" : "text-ink-soft",
                )}
              >
                <li className="flex items-start gap-2">
                  <span aria-hidden>◦</span>
                  <span>
                    Assignment{" "}
                    {rules.assignmentAllowed ? "permitted" : "restricted"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden>◦</span>
                  <span>
                    {rules.assignmentDisclosureRequired
                      ? "Disclosure required"
                      : "Disclosure discretionary"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden>◦</span>
                  <span>
                    {rules.attorneyAtCloseCustomary
                      ? "Attorney close customary"
                      : "Title company close standard"}
                  </span>
                </li>
              </ul>
            )}
            {selected && (
              <Badge
                tone="brass"
                className="mt-4 self-start"
                aria-hidden
              >
                Selected
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
