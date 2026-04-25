"use client";

export function CompsNeeded({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[10px] border border-rule bg-parchment p-5">
      <h3 className="text-sm uppercase tracking-[0.16em] text-ink-faint mb-2">
        Comparables still needed
      </h3>
      <ul className="grid gap-1 text-sm text-ink-soft">
        {items.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1.5 block w-1 h-1 rounded-full bg-ink-faint"
            />
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
