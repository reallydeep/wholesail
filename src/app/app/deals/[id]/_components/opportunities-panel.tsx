"use client";

import type { Opportunity } from "@/lib/ai/inspector/schema";

export function OpportunitiesPanel({ items }: { items: Opportunity[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[10px] border border-forest-200 bg-forest-50/40 p-5 space-y-3">
      <h3 className="font-display text-xl text-ink">Opportunities</h3>
      <ul className="space-y-3">
        {items.map((o, i) => (
          <li key={i} className="grid gap-1">
            <div className="text-sm font-medium text-ink">{o.headline}</div>
            <p className="text-sm text-ink-soft leading-relaxed">{o.detail}</p>
            <div className="text-[11px] uppercase tracking-[0.14em] text-forest-700 font-medium">
              Action:{" "}
              <span className="normal-case font-normal text-ink-soft tracking-normal">
                {o.action}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
