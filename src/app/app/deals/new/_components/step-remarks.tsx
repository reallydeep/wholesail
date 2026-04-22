"use client";

import * as React from "react";
import { SegmentedField, TextField, TextareaField } from "./field";
import { Label } from "@/components/ui/input";
import type { DealDraft } from "../_lib/types";

export function StepRemarks({
  draft,
  onChange,
}: {
  draft: DealDraft;
  onChange: (patch: Partial<DealDraft>) => void;
}) {
  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ photoCount: e.target.files?.length ?? 0 });
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="font-display text-xl text-ink">Seller context</h3>

        <SegmentedField
          label="Seller motivation"
          hint="1 = browsing · 5 = must sell"
          value={draft.sellerMotivation}
          onChange={(v) =>
            onChange({ sellerMotivation: v as 1 | 2 | 3 | 4 | 5 })
          }
          options={[
            { value: 1, label: "1", sub: "Cold" },
            { value: 2, label: "2", sub: "Cool" },
            { value: 3, label: "3", sub: "Warm" },
            { value: 4, label: "4", sub: "Hot" },
            { value: 5, label: "5", sub: "Distressed" },
          ]}
        />

        <TextField
          label="Closing urgency (days)"
          hint="Days until the seller wants to be out"
          placeholder="30"
          inputMode="numeric"
          value={draft.timelineUrgencyDays ?? ""}
          onChange={(e) =>
            onChange({
              timelineUrgencyDays:
                Number(e.target.value.replace(/[^0-9]/g, "")) || undefined,
            })
          }
        />
      </section>

      <hr className="border-rule" />

      <section className="grid gap-4">
        <h3 className="font-display text-xl text-ink">Walkthrough notes</h3>
        <TextareaField
          label="Repair notes"
          hint="Mention foundation, roof, HVAC, mold, fire, structural damage, or cosmetic-only if relevant — the engine calibrates against these keywords."
          placeholder="Roof replaced 2019, updated kitchen, but foundation crack in SW corner and water damage in basement. HVAC needs full replacement."
          rows={6}
          value={draft.repairNotes ?? ""}
          onChange={(e) => onChange({ repairNotes: e.target.value })}
        />
      </section>

      <hr className="border-rule" />

      <section className="grid gap-3">
        <h3 className="font-display text-xl text-ink">Photos</h3>
        <Label>Upload walkthrough photos</Label>
        <label
          htmlFor="photo-upload"
          className="group flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rule rounded-[10px] bg-parchment px-6 py-10 text-center cursor-pointer hover:border-forest-300 transition-colors"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brass-700 group-hover:text-forest-700 transition-colors"
            aria-hidden
          >
            <path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-sm text-ink">
            <span className="font-medium">Drag photos here</span> or click to browse
          </span>
          <span className="text-xs text-ink-faint">
            JPG, PNG, HEIC · We don&rsquo;t persist these yet — counted only
          </span>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={onPhotoChange}
          />
        </label>
        {draft.photoCount != null && draft.photoCount > 0 && (
          <p className="text-xs text-forest-700 font-medium">
            {draft.photoCount} photo{draft.photoCount === 1 ? "" : "s"} staged.
          </p>
        )}
      </section>
    </div>
  );
}
