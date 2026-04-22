"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthCard,
  AuthField,
  AuthSubmit,
  AuthError,
} from "../_components/auth-card";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  return (
    <React.Suspense fallback={<div className="text-white/50 text-sm">Loading…</div>}>
      <SignInForm />
    </React.Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/app";
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    const sb = supabaseBrowser();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard
      overline="Welcome back"
      title={
        <>
          Open the{" "}
          <em className="not-italic text-white/60">ledger.</em>
        </>
      }
      subtitle="Sign in to pick up where you left off on the desk."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="text-white underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@firm.co"
          required
        />
        <AuthField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
        />

        <div className="flex items-center justify-end -mt-1">
          <Link
            href="/forgot"
            className="text-[11px] text-white/50 hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <AuthSubmit label="Sign in" pending={pending} />
        </div>

        <AuthError error={error} />
      </form>
    </AuthCard>
  );
}
