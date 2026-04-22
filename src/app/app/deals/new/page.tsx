"use client";

import * as React from "react";
import Link from "next/link";
import { Container, SectionLabel } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { analyzeDeal } from "@/lib/analysis";
import { decideCompliance } from "@/lib/compliance";
import {
  STEP_LABELS,
  STEP_ORDER,
  type WizardStep,
} from "./_lib/types";
import { draftToInput, validateStep } from "./_lib/draft-to-input";
import { useDraft } from "./_lib/use-draft";
import { WizardProgress } from "./_components/wizard-progress";
import { StepStrategy } from "./_components/step-strategy";
import { StepState } from "./_components/step-state";
import { StepProperty } from "./_components/step-property";
import { StepRemarks } from "./_components/step-remarks";
import { StepAnalyze } from "./_components/step-analyze";
import { StepReview } from "./_components/step-review";

const STEP_COPY: Record<
  WizardStep,
  { overline: string; title: string; sub: string }
> = {
  strategy: {
    overline: "Step 1 · Strategy",
    title: "What's the play?",
    sub: "Pick one. The math, the clauses, and the decision rules all pivot off this.",
  },
  state: {
    overline: "Step 2 · Jurisdiction",
    title: "Where does this property sit?",
    sub: "We merge state-specific clauses into every generated document.",
  },
  property: {
    overline: "Step 3 · The property",
    title: "Tell us about the house.",
    sub: "Address, facts, and the three numbers that matter — asking, ARV, and the fee.",
  },
  remarks: {
    overline: "Step 4 · Context",
    title: "What did you see on the walk-through?",
    sub: "Repair keywords calibrate the estimate. Seller motivation colors the decision.",
  },
  analyze: {
    overline: "Step 5 · Analysis",
    title: "Running the numbers.",
    sub: "Pursue · Review · Pass — stamped against your thresholds.",
  },
  review: {
    overline: "Step 6 · Paper the deal",
    title: "Your starter documents.",
    sub: "Add the parties. Pick a doc. The state overlay is already merged.",
  },
};

function Chevron({
  dir,
  className = "w-4 h-4",
}: {
  dir: "left" | "right";
  className?: string;
}) {
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
      <path d={dir === "right" ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} />
    </svg>
  );
}

export default function NewDealPage() {
  const { draft, patch, reset } = useDraft();
  const [step, setStep] = React.useState<WizardStep>("strategy");
  const [error, setError] = React.useState<string | null>(null);

  const idx = STEP_ORDER.indexOf(step);
  const isFirst = idx === 0;
  const isLast = idx === STEP_ORDER.length - 1;

  const { analysis, compliance, analysisError } = React.useMemo(() => {
    const input = draftToInput(draft);
    if (!input) {
      return { analysis: undefined, compliance: undefined, analysisError: undefined };
    }
    try {
      const a = analyzeDeal(input);
      const c = draft.state ? decideCompliance(draft.state, input.strategy) : undefined;
      return { analysis: a, compliance: c, analysisError: undefined };
    } catch (e) {
      return {
        analysis: undefined,
        compliance: undefined,
        analysisError: e instanceof Error ? e.message : "Unknown failure",
      };
    }
  }, [draft]);

  const handlePatch = (p: Parameters<typeof patch>[0]) => {
    setError(null);
    patch(p);
  };

  const goNext = () => {
    const msg = validateStep(step, draft);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setStep(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]);
  };

  const goBack = () => {
    setError(null);
    setStep(STEP_ORDER[Math.max(idx - 1, 0)]);
  };

  const copy = STEP_COPY[step];

  const resetDraft = () => {
    reset();
    setStep("strategy");
    setError(null);
  };

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-10 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-ink-faint hover:text-ink transition-colors"
            >
              <Chevron dir="left" className="w-3 h-3" />
              Pipeline
            </Link>
            <button
              type="button"
              onClick={resetDraft}
              className="text-xs uppercase tracking-[0.16em] text-ink-faint hover:text-clay-600 transition-colors"
            >
              Reset draft
            </button>
          </div>
          <WizardProgress current={step} />
        </div>

        <div className="grid gap-10">
          <header className="grid gap-2 max-w-2xl">
            <SectionLabel>{copy.overline}</SectionLabel>
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-[1.05] tracking-tight">
              {copy.title}
            </h1>
            <p className="text-ink-soft text-base mt-1">{copy.sub}</p>
          </header>

          <div
            key={step}
            className="animate-[rise-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            {step === "strategy" && (
              <StepStrategy draft={draft} onChange={handlePatch} />
            )}
            {step === "state" && (
              <StepState draft={draft} onChange={handlePatch} />
            )}
            {step === "property" && (
              <StepProperty draft={draft} onChange={handlePatch} />
            )}
            {step === "remarks" && (
              <StepRemarks draft={draft} onChange={handlePatch} />
            )}
            {step === "analyze" && (
              <StepAnalyze
                analysis={analysis}
                compliance={compliance}
                error={analysisError}
              />
            )}
            {step === "review" && (
              <StepReview
                draft={draft}
                onChange={handlePatch}
                analysis={analysis}
                compliance={compliance}
              />
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-clay-600 bg-[#f4e0d8] border border-[#e8c9bc] px-4 py-2.5 rounded-[6px]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-rule">
            <Button
              variant="ghost"
              size="lg"
              onClick={goBack}
              disabled={isFirst}
              aria-label="Previous step"
            >
              <Chevron dir="left" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-ink-faint tabular-nums uppercase tracking-[0.14em]">
                {idx + 1} / {STEP_ORDER.length} · {STEP_LABELS[step]}
              </span>
              {!isLast ? (
                <Button variant="primary" size="lg" onClick={goNext}>
                  {step === "remarks" ? "Analyze" : "Next"}
                  <Chevron dir="right" />
                </Button>
              ) : (
                <Link href="/app">
                  <Button variant="brass" size="lg">
                    Finish
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
