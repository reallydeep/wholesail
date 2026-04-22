"use client";

import { MoneyField, SegmentedField, TextField } from "./field";
import type { DealDraft } from "../_lib/types";

export function StepProperty({
  draft,
  onChange,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
}) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="font-display text-xl text-ink">Address</h3>
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
