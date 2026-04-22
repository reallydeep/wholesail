"use client";

import * as React from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input {...props} />
    </Field>
  );
}

export function MoneyField({
  label,
  hint,
  valueCents,
  onChangeCents,
  placeholder,
  id,
}: {
  label: string;
  hint?: string;
  valueCents?: number;
  onChangeCents: (cents: number | undefined) => void;
  placeholder?: string;
  id?: string;
}) {
  const [raw, setRaw] = React.useState(
    valueCents == null ? "" : (valueCents / 100).toString(),
  );
  const [lastExternal, setLastExternal] = React.useState(valueCents);
  if (valueCents !== lastExternal) {
    setLastExternal(valueCents);
    setRaw(valueCents == null ? "" : (valueCents / 100).toString());
  }
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">
          $
        </span>
        <Input
          id={id}
          inputMode="decimal"
          placeholder={placeholder ?? "0"}
          value={raw}
          className="pl-7 tabular-nums"
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            setRaw(v);
            if (v === "") {
              onChangeCents(undefined);
              return;
            }
            const parsed = parseFloat(v);
            if (!Number.isNaN(parsed)) {
              onChangeCents(Math.round(parsed * 100));
            }
          }}
        />
      </div>
    </Field>
  );
}

export function TextareaField({
  label,
  hint,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Textarea {...props} />
    </Field>
  );
}

export function SegmentedField<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string; sub?: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-3.5 py-2.5 rounded-[6px] border text-left transition-colors",
                selected
                  ? "bg-forest-700 text-bone border-forest-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "bg-parchment border-rule hover:border-forest-200 text-ink",
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.sub && (
                <span
                  className={cn(
                    "text-[11px]",
                    selected ? "text-bone/70" : "text-ink-faint",
                  )}
                >
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
