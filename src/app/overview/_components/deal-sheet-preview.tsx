import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DealSheetPreview() {
  return (
    <div className="relative">
      {/* the stamp */}
      <div
        aria-hidden
        className="absolute -top-5 -right-3 z-20 animate-stamp [animation-delay:600ms]"
      >
        <div className="px-4 py-1.5 border-[2.5px] border-forest-700 text-forest-700 rounded-[3px] rotate-[-4deg] bg-parchment/90 font-display italic text-xl tracking-tight shadow-[var(--shadow-raised)]">
          Pursue
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* header */}
        <div className="bg-forest-900 text-bone px-6 py-5 border-b border-forest-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-brass-300 font-medium">
                Deal Sheet · WS-00412
              </div>
              <div className="font-display text-2xl mt-1.5">
                1428 Buckeye Lane
              </div>
              <div className="text-sm text-bone/70 mt-0.5">
                Columbus, OH &middot; 43207
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.22em] text-brass-300">
                Strategy
              </div>
              <div className="text-sm font-medium mt-1">Wholesale</div>
            </div>
          </div>
        </div>

        {/* numbers grid */}
        <div className="grid grid-cols-3">
          <Stat label="ARV" value="$310,000" />
          <Stat label="Asking" value="$185,000" />
          <Stat label="Repair tier" value="Medium" sub="$42k est." />
          <Stat label="MAO" value="$172,000" accent />
          <Stat label="Assignment fee" value="$12,000" />
          <Stat label="Spread" value="+$13,000" accent />
        </div>

        {/* reasons */}
        <div className="px-6 py-5 bg-surface-sunk/60 border-t border-rule">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-medium mb-3">
            Why pursue
          </div>
          <ul className="space-y-2 text-sm">
            {[
              "Asking is $13k below MAO — room to offer lower still.",
              "Seller motivation 4/5, 21-day close window.",
              "OH allows assignment with intent disclosure.",
            ].map((r, i) => (
              <li key={i} className="flex gap-2.5 text-ink">
                <span className="text-brass-500 font-mono shrink-0">
                  ◆
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* flags */}
        <div className="px-6 py-4 bg-parchment border-t border-rule flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-medium">
            Flags
          </span>
          <Badge tone="brass">Tenant-occupied</Badge>
          <Badge tone="neutral">Roof ~15 yrs</Badge>
        </div>

        {/* footer */}
        <div className="px-6 py-3 border-t border-rule flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-ink-faint font-mono">
          <span>Generated 2026-04-20</span>
          <span>v0.1 · rule snapshot oh-2026-q1</span>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="px-5 py-4 border-r border-b border-rule last-of-type:border-r-0 [&:nth-child(3n)]:border-r-0">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint font-medium">
        {label}
      </div>
      <div
        className={`font-display text-xl mt-1 ${accent ? "text-forest-700" : "text-ink"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-faint mt-0.5">{sub}</div>}
    </div>
  );
}
