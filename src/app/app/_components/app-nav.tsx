"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app", label: "Pipeline", match: (p: string) => p === "/app" || p.startsWith("/app/deals/") && !p.endsWith("/new") },
  { href: "/app/deals/new", label: "New deal", match: (p: string) => p.endsWith("/new") },
  { href: "/app/library", label: "Documents", match: (p: string) => p.startsWith("/app/library") },
];

export function AppNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative py-1 transition-colors",
              active
                ? "text-ink font-medium"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {l.label}
            {active && (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-[3px] h-px bg-brass-500"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
