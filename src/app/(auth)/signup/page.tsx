"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthField,
  AuthSubmit,
  AuthError,
} from "../_components/auth-card";
import { StatePicker } from "./_components/state-picker";
import type { StateCode } from "@/lib/compliance/types";

export default function SignUpPage() {
  return (
    <React.Suspense fallback={<div className="text-white/50 text-sm">Loading…</div>}>
      <SignUpForm />
    </React.Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [states, setStates] = React.useState<StateCode[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    const displayName = String(form.get("name") ?? "").trim();
    const firmName = String(form.get("firmName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (states.length === 0) {
      setError("Pick at least one state.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, firmName, email, password, states }),
      });
      if (res.status === 202) {
        router.push("/waitlist?state=" + encodeURIComponent(states.join(",")));
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `signup failed: ${res.status}`);
      }
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      overline="Start your trial"
      title={
        <>
          Put your next deal{" "}
          <em className="not-italic text-white/60">on paper.</em>
        </>
      }
      subtitle={
        <>
          7-day trial. Card required on day 8. Pick every state your team closes
          deals in — we&rsquo;ll waitlist any we don&rsquo;t support yet.
        </>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Your name"
          name="name"
          autoComplete="name"
          placeholder="Alex Morgan"
          required
        />
        <AuthField
          label="Firm name"
          name="firmName"
          autoComplete="organization"
          placeholder="Morgan Acquisitions LLC"
          required
        />
        <AuthField
          label="Work email"
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        <StatePicker value={states} onChange={setStates} />

        <div className="pt-2">
          <AuthSubmit label="Start 7-day trial" pending={pending} />
        </div>

        <AuthError error={error} />

        <p className="text-[11px] text-white/40 leading-relaxed">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            privacy policy
          </Link>
          . Wholesail is a software tool, not a law firm or brokerage.
        </p>
      </form>
    </AuthCard>
  );
}
