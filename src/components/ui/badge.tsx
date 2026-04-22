import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium tracking-tight rounded-[3px] border",
  {
    variants: {
      tone: {
        neutral: "bg-bone-deep text-ink-soft border-rule",
        forest: "bg-forest-50 text-forest-700 border-forest-200",
        brass: "bg-brass-50 text-brass-700 border-brass-100",
        clay: "bg-[#f4e0d8] text-clay-600 border-[#e8c9bc]",
        ink: "bg-ink text-bone border-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
