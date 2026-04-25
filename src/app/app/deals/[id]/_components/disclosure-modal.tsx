"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  OH_SB131_TITLE,
  OH_SB131_BODY,
  OH_SB131_REQUIREMENT,
} from "@/lib/compliance/disclosures/oh-sb131";
import type { DisclosureCode } from "@/lib/compliance/enforcement";

const COPY: Record<
  DisclosureCode,
  { title: string; body: string; requirement: string }
> = {
  OH_SB131: {
    title: OH_SB131_TITLE,
    body: OH_SB131_BODY,
    requirement: OH_SB131_REQUIREMENT,
  },
  FL_HB1049: {
    title: "Florida HB1049",
    body: "Florida disclosure body.",
    requirement: "Florida requirement.",
  },
};

export function DisclosureModal({
  code,
  onAck,
  onCancel,
}: {
  code: DisclosureCode;
  onAck: () => void;
  onCancel: () => void;
}) {
  const [agreed, setAgreed] = React.useState(false);
  const copy = COPY[code];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="bg-bone rounded-[12px] border border-rule shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <header className="px-6 py-5 border-b border-rule">
          <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
            Required disclosure · {code}
          </div>
          <h2 className="font-display text-xl text-ink mt-1">{copy.title}</h2>
          <p className="text-xs text-ink-soft mt-2">{copy.requirement}</p>
        </header>
        <div className="px-6 py-5 overflow-y-auto whitespace-pre-wrap text-sm text-ink-soft leading-relaxed">
          {copy.body}
        </div>
        <footer className="px-6 py-4 border-t border-rule space-y-3 bg-parchment">
          <label className="flex items-start gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I have delivered this disclosure to the seller and acknowledge
              wholesale intent. I am acting as a principal, not an agent.
            </span>
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAck}
              disabled={!agreed}
            >
              Acknowledge & continue
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
