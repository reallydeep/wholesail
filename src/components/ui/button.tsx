import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium tracking-tight transition-[background,color,box-shadow,transform]",
    "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-none",
    "hover:-translate-y-[1px] active:translate-y-[1px] disabled:hover:translate-y-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-forest-700 text-bone hover:bg-forest-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_0_rgba(0,0,0,0.12)]",
        secondary:
          "bg-bone-deep text-ink hover:bg-rule border border-rule",
        ghost: "text-ink hover:bg-bone-deep",
        outline:
          "border border-forest-700 text-forest-700 hover:bg-forest-700 hover:text-bone",
        brass:
          "bg-brass-500 text-ink hover:bg-brass-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_0_rgba(0,0,0,0.12)]",
        destructive:
          "bg-clay-500 text-bone hover:bg-clay-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_0_rgba(0,0,0,0.12)]",
        link: "text-forest-700 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[4px]",
        md: "h-10 px-5 text-sm rounded-[6px]",
        lg: "h-12 px-7 text-base rounded-[6px]",
        xl: "h-14 px-8 text-base rounded-[8px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size }), className)}
        {...props}
      />
    );
  }
);
