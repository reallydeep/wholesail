"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { ESIGN_CONSENT_TEXT, ESIGN_CONSENT_VERSION } from "@/lib/esign/consent";

export interface SignFormProps {
  token: string;
  signerName: string;
  compact?: boolean;
  onSigned?: () => void;
}

export function SignForm({ token, signerName, compact, onSigned }: SignFormProps) {
  const router = useRouter();
  const padRef = React.useRef<SignaturePadHandle>(null);
  const [typedName, setTypedName] = React.useState(signerName);
  const [consent, setConsent] = React.useState(false);
  const [empty, setEmpty] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit =
    !empty && consent && typedName.trim().length >= 2 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const png = padRef.current?.toDataURL();
    if (!png) {
      setError("Please draw your signature in the box above.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/esign/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signaturePng: png,
          typedName: typedName.trim(),
          consent: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? `Server error (${res.status}).`);
        setSubmitting(false);
        return;
      }
      if (onSigned) {
        onSigned();
        return;
      }
      router.push(`/sign/${encodeURIComponent(token)}/signed`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "grid gap-4"
          : "rounded-[10px] border border-rule bg-parchment p-6 sm:p-8 grid gap-6"
      }
    >
      {!compact && (
        <div>
          <h2 className="font-display text-2xl text-ink">Add your signature</h2>
          <p className="text-ink-soft text-sm mt-1">
            Sign once with your mouse, finger, or stylus. Use the Clear button
            to start over.
          </p>
        </div>
      )}

      <div>
        <label className="text-[11px] uppercase tracking-[0.16em] text-brass-700 font-medium block mb-2">
          Your signature
        </label>
        <SignaturePad
          ref={padRef}
          height={compact ? 140 : 180}
          onChange={(e) => setEmpty(e)}
        />
        <div className="flex justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              padRef.current?.clear();
              setEmpty(true);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div>
        <label
          htmlFor="typed-name"
          className="text-[11px] uppercase tracking-[0.16em] text-brass-700 font-medium block mb-2"
        >
          Type your full legal name
        </label>
        <Input
          id="typed-name"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Jane Q. Public"
          autoComplete="name"
          required
        />
      </div>

      <details className="text-sm text-ink-soft border border-rule rounded-[6px] bg-bone p-4">
        <summary className="cursor-pointer font-medium text-ink">
          Electronic signature disclosure (UETA / ESIGN Act, v{ESIGN_CONSENT_VERSION})
        </summary>
        <pre className="whitespace-pre-wrap mt-3 text-[13px] leading-relaxed font-sans">
          {ESIGN_CONSENT_TEXT}
        </pre>
      </details>

      <label className="flex items-start gap-3 text-sm text-ink-soft cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 accent-forest-700"
          required
        />
        <span>
          I agree to use electronic records and signatures for this
          transaction, and I understand my electronic signature has the same
          legal effect as a handwritten signature.
        </span>
      </label>

      {error && (
        <div className="rounded-[6px] border border-clay-300 bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-ink-faint">
          Your IP address and browser will be recorded for the audit trail.
        </p>
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit}>
          {submitting ? "Signing…" : "Sign document"}
        </Button>
      </div>
    </form>
  );
}
