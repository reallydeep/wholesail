"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/lib/auth/use-supabase-session";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, firm, membership, loading } = useSupabaseSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <div className="h-7 w-7 rounded-full bg-rule/40 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="text-xs uppercase tracking-[0.14em] text-ink-soft hover:text-ink transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    "Operator";
  const email = user.email ?? "";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const plan = firm?.plan ?? "trialing";
  const planLabel =
    plan === "trialing"
      ? "Trial"
      : plan === "scout"
        ? "Scout"
        : plan === "operator"
          ? "Operator"
          : plan === "firm"
            ? "Firm"
            : "Canceled";

  async function handleSignOut() {
    await supabaseBrowser().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-rule hover:border-forest-300 hover:bg-parchment transition-colors"
      >
        <span
          aria-hidden
          className="grid place-items-center h-7 w-7 rounded-full bg-forest-700 text-bone text-[11px] font-medium tracking-wide"
        >
          {initials || "·"}
        </span>
        <span className="hidden sm:block text-xs text-ink">
          {displayName.split(/\s+/)[0]}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "text-ink-faint transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 rounded-[8px] border border-rule bg-parchment shadow-[0_12px_28px_-12px_rgba(26,31,26,0.22)] overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-rule">
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint mb-1">
              Signed in as
            </div>
            <div className="text-sm text-ink font-medium truncate">
              {displayName}
            </div>
            <div className="text-xs text-ink-soft truncate">{email}</div>
            {firm && (
              <div className="text-[11px] text-ink-soft mt-1 truncate">
                {firm.name}
                {membership?.role ? ` · ${membership.role}` : ""}
              </div>
            )}
            <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-brass-700 font-medium">
              {planLabel}
            </div>
          </div>
          <ul className="py-1.5">
            <li>
              <Link
                href="/app"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-bone-deep transition-colors"
              >
                Pipeline
              </Link>
            </li>
            <li>
              <Link
                href="/app/deals/new"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-bone-deep transition-colors"
              >
                Start a deal
              </Link>
            </li>
            <li>
              <Link
                href="/overview"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-bone-deep transition-colors"
              >
                Landing
              </Link>
            </li>
          </ul>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-3 text-sm text-clay-600 border-t border-rule hover:bg-bone-deep transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
