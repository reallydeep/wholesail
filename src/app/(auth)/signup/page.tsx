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
import { signUp, type Session } from "@/lib/auth/session";

const PLAN_LABELS: Record<Session["plan"], string> = {
  beta: "Beta · Free",
  operator: "Operator · Waitlist",
  desk: "Desk · Invite only",
};

export default function SignUpPage() {
  return (
    <React.Suspense fallback={<div className="text-white/50 text-sm">Loading…</div>}>
      <SignUpForm />
    </React.Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedPlan = (params?.get("plan") ?? "beta") as Session["plan"];
  const plan: Session["plan"] = requestedPlan in PLAN_LABELS ? requestedPlan : "beta";

  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setPending(true);
    const res = await signUp({ name, email, password, plan });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/app");
  }

  return (
    <AuthCard
      overline="New account"
      title={
        <>
          Put your next deal{" "}
          <em className="not-italic text-white/60">on paper.</em>
        </>
      }
      subtitle={
        <>
          You&rsquo;re joining <strong className="text-white/80">{PLAN_LABELS[plan]}</strong>.
          {plan === "beta"
            ? " No card needed — you're in the first cohort."
            : " We'll notify you the moment this tier opens."}
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Your name"
          name="name"
          autoComplete="name"
          placeholder="Alex Morgan"
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        <input type="hidden" name="plan" value={plan} />

        <div className="pt-2">
          <AuthSubmit label="Create account" pending={pending} />
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
          . Wholesail is a software tool, not a law firm.
        </p>
      </form>
    </AuthCard>
  );
}
