import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1180px] px-6 md:px-8", className)}
      {...props}
    />
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brass-700 font-medium",
        className
      )}
    >
      <span aria-hidden className="inline-block w-6 h-px bg-brass-500" />
      {children}
    </div>
  );
}
