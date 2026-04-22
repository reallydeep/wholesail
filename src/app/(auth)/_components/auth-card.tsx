import * as React from "react";

export function AuthCard({
  overline,
  title,
  subtitle,
  children,
  footer,
}: {
  overline: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="liquid-glass rounded-[18px] p-8 sm:p-10 bg-white/[0.03]">
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-4">
          {overline}
        </div>
        <h1
          className="text-4xl sm:text-5xl text-white leading-[1.02]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            letterSpacing: "-1px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-white/60 mt-4 leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>
      {footer && (
        <div className="mt-6 text-center text-sm text-white/50">{footer}</div>
      )}
    </div>
  );
}

export function AuthField({
  label,
  type = "text",
  name,
  placeholder,
  autoComplete,
  required,
  minLength,
  defaultValue,
}: {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.22em] text-white/50 mb-2">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        className="w-full rounded-[10px] bg-white/[0.04] border border-white/10 focus:border-white/30 focus:bg-white/[0.06] transition-colors px-4 py-3 text-white placeholder:text-white/30 text-sm outline-none"
      />
    </label>
  );
}

export function AuthSubmit({
  label,
  pending,
}: {
  label: string;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-white text-black px-6 py-3.5 text-sm font-medium hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-progress"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

export function AuthError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mt-3 rounded-[8px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
    >
      {error}
    </div>
  );
}
