import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full h-11 px-3.5 bg-parchment border border-rule rounded-[6px]",
          "text-ink placeholder:text-ink-faint text-sm",
          "transition-[border,box-shadow] duration-150",
          "hover:border-rule-strong",
          "focus-visible:outline-none focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/20",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[96px] px-3.5 py-2.5 bg-parchment border border-rule rounded-[6px]",
          "text-ink placeholder:text-ink-faint text-sm leading-relaxed",
          "transition-[border,box-shadow] duration-150",
          "hover:border-rule-strong",
          "focus-visible:outline-none focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/20",
          "disabled:opacity-50 resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-xs font-medium tracking-wide uppercase text-ink-soft mb-1.5",
        className
      )}
      {...props}
    />
  );
}
