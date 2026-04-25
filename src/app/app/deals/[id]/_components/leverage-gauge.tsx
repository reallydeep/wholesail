"use client";

export function LeverageGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone =
    pct >= 70 ? "bg-forest-600" : pct >= 40 ? "bg-brass-500" : "bg-clay-600";
  return (
    <div className="rounded-[10px] border border-rule bg-parchment p-5">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brass-700 font-medium">
          Leverage score
        </div>
        <div className="text-2xl font-display text-ink tabular-nums">
          {pct}
          <span className="text-xs text-ink-faint">/100</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-bone-deep overflow-hidden">
        <div
          className={`h-full ${tone} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink-faint mt-2 font-mono uppercase tracking-[0.14em]">
        <span>Seller leads</span>
        <span>Buyer owns the table</span>
      </div>
    </div>
  );
}
