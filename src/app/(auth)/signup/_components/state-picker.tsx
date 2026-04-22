"use client";
import * as React from "react";
import { SUPPORTED_STATES } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";

export function StatePicker({
  value,
  onChange,
}: {
  value: StateCode[];
  onChange: (next: StateCode[]) => void;
}) {
  function toggle(code: StateCode) {
    onChange(
      value.includes(code) ? value.filter((c) => c !== code) : [...value, code],
    );
  }
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/50 mb-3">
        States you operate in
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {SUPPORTED_STATES.map((s) => {
          const active = value.includes(s.code);
          const disclosure = s.tier === "yellow";
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => toggle(s.code)}
              className={[
                "relative rounded-[8px] px-2.5 py-2 text-left transition text-sm",
                "border",
                active
                  ? "border-white/50 bg-white/[0.12] text-white"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:bg-white/[0.05]",
              ].join(" ")}
              aria-pressed={active}
            >
              <div className="font-mono text-xs tracking-wide">{s.code}</div>
              <div className="text-[10px] text-white/50 leading-tight truncate">
                {s.name}
              </div>
              {disclosure && (
                <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-amber-400/80" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40">
        <span className="inline-flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-amber-400/80" /> disclosure enforced
        </span>
        <span className="opacity-60">Launch footprint: 14 states</span>
      </div>
      {value.length === 0 && (
        <p className="text-xs text-amber-200/80 mt-2">
          Pick at least one state to continue.
        </p>
      )}
    </div>
  );
}
