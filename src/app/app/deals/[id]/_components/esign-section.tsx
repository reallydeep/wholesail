"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSigningRequests } from "@/lib/esign/store";
import {
  DOC_LABEL,
  ROLE_LABEL,
  type DocType,
  type SignerRole,
  type SigningRequest,
  type SigningStatus,
} from "@/lib/esign/types";
import { cn } from "@/lib/utils";
import { SignForm } from "@/app/sign/[token]/_components/sign-form";

const DOC_OPTIONS: DocType[] = ["offer-letter", "psa", "assignment"];
const ROLE_OPTIONS: SignerRole[] = ["seller", "buyer"];

const STATUS_TONE: Record<SigningStatus, "brass" | "forest" | "clay"> = {
  pending: "brass",
  viewed: "brass",
  signed: "forest",
  declined: "clay",
  expired: "clay",
};

export function EsignSection({
  dealId,
  firmId,
}: {
  dealId: string;
  firmId?: string | null;
}) {
  const { requests, loading, create, refresh } = useSigningRequests(dealId);
  const [docType, setDocType] = React.useState<DocType>("psa");
  const [signerRole, setSignerRole] = React.useState<SignerRole>("seller");
  const [signerName, setSignerName] = React.useState("");
  const [signerEmail, setSignerEmail] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      await create({
        dealId,
        docType,
        signerRole,
        signerName: signerName.trim() || undefined,
        signerEmail: signerEmail.trim() || undefined,
        firmId: firmId ?? undefined,
      });
      setSignerName("");
      setSignerEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create signing request.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-[10px] border border-rule bg-parchment p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-ink">E-signature requests</h3>
        <span className="text-[11px] text-ink-faint font-mono uppercase tracking-[0.14em]">
          UETA / ESIGN compliant
        </span>
      </div>
      <p className="text-sm text-ink-soft mb-5">
        Generate a signing link for any starter document. The signer opens the
        link, reviews the doc, and signs in their browser. Their IP, browser,
        and timestamp are captured for the audit trail.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Field label="Document">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="h-11 w-full rounded-[6px] border border-rule bg-parchment px-3 text-sm text-ink"
          >
            {DOC_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DOC_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Signer role">
          <select
            value={signerRole}
            onChange={(e) => setSignerRole(e.target.value as SignerRole)}
            className="h-11 w-full rounded-[6px] border border-rule bg-parchment px-3 text-sm text-ink"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Signer name (optional)">
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Jane Public"
          />
        </Field>
        <Field label="Signer email (optional)">
          <Input
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="signer@example.com"
            type="email"
          />
        </Field>
      </div>

      {error && (
        <div className="mb-3 rounded-[6px] border border-clay-300 bg-clay-50 px-4 py-2 text-sm text-clay-600">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Generating…" : "Generate signing link"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-ink-faint italic">
          No signing requests yet. Generate one above to send to the seller or
          buyer.
        </p>
      ) : (
        <ul className="grid gap-3">
          {requests.map((r) => (
            <SigningRow key={r.id} req={r} onSigned={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SigningRow({
  req,
  onSigned,
}: {
  req: SigningRequest;
  onSigned: () => Promise<void>;
}) {
  const [copied, setCopied] = React.useState(false);
  const [signing, setSigning] = React.useState(false);
  const url = React.useMemo(() => {
    if (typeof window === "undefined") return `/sign/${req.token}`;
    return `${window.location.origin}/sign/${req.token}`;
  }, [req.token]);

  const canSignInline =
    req.status === "pending" || req.status === "viewed";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <li
      className={cn(
        "rounded-[8px] border bg-bone p-4 grid gap-3",
        req.status === "signed"
          ? "border-forest-200"
          : req.status === "expired" || req.status === "declined"
            ? "border-clay-300"
            : "border-rule",
      )}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-ink">
            {DOC_LABEL[req.docType]}
          </span>
          <span className="text-[11px] text-ink-faint font-mono uppercase tracking-[0.14em]">
            {ROLE_LABEL[req.signerRole]}
          </span>
          {req.signerName && (
            <span className="text-xs text-ink-soft">· {req.signerName}</span>
          )}
        </div>
        <Badge tone={STATUS_TONE[req.status]}>{req.status}</Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-[200px] text-xs font-mono text-ink-soft bg-parchment border border-rule rounded-[4px] px-2 py-1.5 truncate">
          {url}
        </code>
        <Button type="button" variant="secondary" size="sm" onClick={copy}>
          {copied ? "Copied!" : "Copy link"}
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="ghost" size="sm">
            Open
          </Button>
        </a>
        {canSignInline && (
          <Button
            type="button"
            variant={signing ? "ghost" : "primary"}
            size="sm"
            onClick={() => setSigning((s) => !s)}
          >
            {signing ? "Cancel" : "Sign here"}
          </Button>
        )}
      </div>
      {signing && canSignInline && (
        <div className="rounded-[6px] border border-rule bg-parchment p-4">
          <SignForm
            token={req.token}
            signerName={req.signerName ?? ""}
            compact
            onSigned={async () => {
              setSigning(false);
              await onSigned();
            }}
          />
        </div>
      )}
      <div className="text-[11px] text-ink-faint font-mono uppercase tracking-[0.12em] flex items-center gap-3 flex-wrap">
        <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
        {req.viewedAt && (
          <span>Viewed {new Date(req.viewedAt).toLocaleDateString()}</span>
        )}
        {req.signedAt && (
          <span className="text-forest-700">
            Signed {new Date(req.signedAt).toLocaleString()}
          </span>
        )}
        <span className="ml-auto">
          Expires {new Date(req.expiresAt).toLocaleDateString()}
        </span>
      </div>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
