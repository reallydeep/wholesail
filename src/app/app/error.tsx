"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] render error:", error);
  }, [error]);

  return (
    <Container className="py-20">
      <div className="max-w-xl">
        <div className="text-[11px] uppercase tracking-[0.18em] text-clay-600 font-mono mb-2">
          Ledger error
        </div>
        <h1 className="font-display text-3xl text-ink leading-tight">
          Something on this page didn&apos;t load.
        </h1>
        <p className="text-ink-soft mt-3 leading-relaxed">
          The dashboard hit an error while rendering. Your data is safe — try
          again, or head back to the landing page.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-faint mt-4 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost">Back to landing</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
