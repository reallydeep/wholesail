"use client";

import * as React from "react";
import { MoneyField, SegmentedField, TextField } from "./field";
import { parseAddress } from "@/lib/address/parse";
import { cn } from "@/lib/utils";
import type { DealDraft } from "../_lib/types";

export function StepProperty({
  draft,
  onChange,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
}) {
  const [paste, setPaste] = React.useState("");
  const [showManual, setShowManual] = React.useState(false);
  const [lastParse, setLastParse] = React.useState<ReturnType<typeof parseAddress> | null>(null);

  const applyParse = React.useCallback(
    (raw: string) => {
      const parsed = parseAddress(raw);
      setLastParse(parsed);
      onChange({
        propertyAddress: parsed.street,
        propertyCity: parsed.city,
        propertyZip: parsed.zip,
        ...(parsed.state ? { state: parsed.state as DealDraft["state"] } : {}),
      });
    },
    [onChange],
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    e.preventDefault();
    setPaste(text);
    applyParse(text);
  };

  const parsedChips = lastParse
    ? [
        { label: "Street", value: lastParse.street },
        { label: "City", value: lastParse.city },
        { label: "State", value: lastParse.state },
        { label: "ZIP", value: lastParse.zip },
      ]
    : [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-ink">Address</h3>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
          >
            {showManual ? "Use paste mode" : "Edit fields manually"}
          </button>
        </div>

        {!showManual && (
          <div className="grid gap-3">
            <div className="relative group">
              <textarea
                value={paste}
                onPaste={handlePaste}
                onChange={(e) => {
                  setPaste(e.target.value);
                  applyParse(e.target.value);
                }}
                placeholder="Paste the full address — 1428 Buckeye Ln, Columbus, OH 43201"
                rows={2}
                className="w-full resize-none rounded-[10px] border border-rule bg-parchment px-4 py-3.5 text-base text-ink placeholder:text-ink-faint font-display tracking-tight focus:outline-none focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 transition-all"
              />
              <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium font-mono opacity-60 pointer-events-none">
                ⌘V · Paste
              </div>
            </div>

            {lastParse && (
              <div
                key={lastParse.raw}
                className="grid gap-2 animate-[rise-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
              >
                <div className="flex flex-wrap gap-1.5">
                  {parsedChips.map((chip) => (
                    <Chip key={chip.label} label={chip.label} value={chip.value} />
                  ))}
                </div>
                {lastParse.warnings.length > 0 && (
                  <p className="text-[11px] text-clay-600 leading-relaxed">
                    {lastParse.warnings.join(" · ")}. Toggle manual to finish filling.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {showManual && (
          <div className="grid gap-4">
            <TextField
              label="Street address"
              placeholder="1428 Buckeye Lane"
              value={draft.propertyAddress ?? ""}
              onChange={(e) => onChange({ propertyAddress: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField
                label="City"
                placeholder="Columbus"
                value={draft.propertyCity ?? ""}
                onChange={(e) => onChange({ propertyCity: e.target.value })}
              />
              <TextField
                label="County (optional)"
                placeholder="Franklin"
                value={draft.propertyCounty ?? ""}
                onChange={(e) => onChange({ propertyCounty: e.target.value })}
              />
              <TextField
                label="ZIP"
                placeholder="43201"
                value={draft.propertyZip ?? ""}
                onChange={(e) => onChange({ propertyZip: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      <hr className="border-rule" />

      <section className="grid gap-4">
        <h3 className="font-display text-xl text-ink">Facts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TextField
            label="Sqft"
            placeholder="1,420"
            inputMode="numeric"
            value={draft.sqft ?? ""}
            onChange={(e) =>
              onChange({ sqft: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined })
            }
          />
          <TextField
            label="Beds"
            placeholder="3"
            inputMode="numeric"
            value={draft.beds ?? ""}
            onChange={(e) =>
              onChange({ beds: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined })
            }
          />
          <TextField
            label="Baths"
            placeholder="2"
            inputMode="decimal"
            value={draft.baths ?? ""}
            onChange={(e) =>
              onChange({ baths: Number(e.target.value.replace(/[^0-9.]/g, "")) || undefined })
            }
          />
          <TextField
            label="Year built"
            placeholder="1974"
            inputMode="numeric"
            value={draft.yearBuilt ?? ""}
            onChange={(e) =>
              onChange({ yearBuilt: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined })
            }
          />
        </div>

        <SegmentedField
          label="Condition"
          hint="1 = distressed · 5 = rent-ready"
          value={draft.conditionRating}
          onChange={(v) => onChange({ conditionRating: v as 1 | 2 | 3 | 4 | 5 })}
          options={[
            { value: 1, label: "1", sub: "Gut" },
            { value: 2, label: "2", sub: "Heavy" },
            { value: 3, label: "3", sub: "Moderate" },
            { value: 4, label: "4", sub: "Light" },
            { value: 5, label: "5", sub: "Turnkey" },
          ]}
        />

        <SegmentedField
          label="Occupancy"
          value={draft.occupancy}
          onChange={(v) => onChange({ occupancy: v as DealDraft["occupancy"] })}
          options={[
            { value: "vacant", label: "Vacant" },
            { value: "owner", label: "Owner-occupied" },
            { value: "tenant", label: "Tenant-occupied" },
          ]}
        />
      </section>

      <hr className="border-rule" />

      <section className="grid gap-4">
        <h3 className="font-display text-xl text-ink">The numbers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField
            label="Asking price"
            valueCents={draft.askingPriceCents}
            onChangeCents={(c) => onChange({ askingPriceCents: c })}
            placeholder="185,000"
          />
          <MoneyField
            label="ARV (after-repair value)"
            valueCents={draft.arvCents}
            onChangeCents={(c) => onChange({ arvCents: c })}
            placeholder="310,000"
            hint="Your estimate of market value once repaired."
          />
          {draft.strategy === "wholesale" && (
            <MoneyField
              label="Assignment fee"
              valueCents={draft.assignmentFeeCents}
              onChangeCents={(c) => onChange({ assignmentFeeCents: c })}
              placeholder="12,000"
            />
          )}
          {draft.strategy === "hold" && (
            <MoneyField
              label="Estimated monthly rent"
              valueCents={draft.estimatedRentCents}
              onChangeCents={(c) => onChange({ estimatedRentCents: c })}
              placeholder="2,100"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function Chip({ label, value }: { label: string; value?: string }) {
  const empty = !value;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-mono uppercase tracking-[0.1em]",
        empty
          ? "border-dashed border-rule text-ink-faint bg-parchment"
          : "border-forest-200 bg-forest-50 text-forest-700",
      )}
    >
      <span className="opacity-60">{label}</span>
      <span className="tabular-nums">{value ?? "—"}</span>
    </span>
  );
}
