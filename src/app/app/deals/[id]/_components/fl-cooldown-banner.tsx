"use client";

import * as React from "react";

export function FlCooldownBanner({ unlocksAt }: { unlocksAt: string }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(unlocksAt).getTime();
  const remaining = Math.max(0, target - now);
  const hrs = Math.floor(remaining / 3600_000);
  const mins = Math.floor((remaining % 3600_000) / 60_000);
  const expired = remaining <= 0;
  return (
    <div
      className={
        "rounded-[10px] border p-4 text-sm " +
        (expired
          ? "border-forest-200 bg-forest-50/40 text-forest-800"
          : "border-brass-300 bg-brass-50/50 text-ink")
      }
    >
      <div className="text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium">
        FL HB1049 · Buyer-send cooldown
      </div>
      {expired ? (
        <p className="mt-1">
          Cooldown elapsed. Assignment marketing now permitted.
        </p>
      ) : (
        <p className="mt-1">
          Assignment marketing is locked for{" "}
          <span className="font-mono tabular-nums">
            {hrs}h {mins}m
          </span>{" "}
          (until {new Date(unlocksAt).toLocaleString()}). The seller's 3-day
          cancellation window must run before sending the contract to a buyer.
        </p>
      )}
    </div>
  );
}
