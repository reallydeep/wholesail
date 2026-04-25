"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { SavedDeal } from "@/lib/deals/store";
import type { DealInspection } from "@/lib/ai/inspector/schema";
import { LeverageGauge } from "./leverage-gauge";
import { DealKillers } from "./deal-killers";
import { OpportunitiesPanel } from "./opportunities-panel";
import { CompsNeeded } from "./comps-needed";

export function AiInspectionSection({ deal }: { deal: SavedDeal }) {
  const [inspection, setInspection] = React.useState<DealInspection | null>(
    deal.aiInspection ?? null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function runInspect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}/inspect`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `inspect failed: ${res.status}`);
      }
      const j = (await res.json()) as { inspection: DealInspection };
      setInspection(j.inspection);
    } catch (e) {
      setError(e instanceof Error ? e.message : "inspect failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
            AI Inspection
          </div>
          <h2 className="font-display text-2xl text-ink mt-0.5">
            Deal killers &amp; leverage
          </h2>
        </div>
        <Button
          variant={inspection ? "ghost" : "primary"}
          size="sm"
          onClick={runInspect}
          disabled={loading}
        >
          {loading
            ? "Inspecting…"
            : inspection
              ? "Re-inspect"
              : "Run inspection"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-clay-600 border border-clay-200 rounded-[6px] px-3 py-2">
          {error}
        </p>
      )}

      {inspection && (
        <div className="grid gap-5">
          <LeverageGauge score={inspection.leverage_score} />
          <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center rounded-[10px] border border-rule bg-parchment p-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Suggested offer
              </div>
              <div className="font-display text-3xl text-ink tabular-nums mt-1">
                {inspection.suggested_offer.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Confidence · {inspection.confidence}
            </div>
          </div>
          <DealKillers killers={inspection.killers} />
          <OpportunitiesPanel items={inspection.opportunities} />
          <CompsNeeded items={inspection.comparables_needed} />
        </div>
      )}
    </div>
  );
}
