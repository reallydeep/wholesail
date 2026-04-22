import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl tracking-tight text-ink",
        className
      )}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className="text-forest-700"
      >
        <path
          d="M2 17L11 3L20 17L11 14L2 17Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
        <circle cx="11" cy="14" r="1.4" fill="var(--color-brass-500)" />
      </svg>
      <span className="leading-none">Wholesail</span>
    </span>
  );
}
