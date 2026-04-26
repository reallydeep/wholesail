import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv, useSupabase } from "@/lib/env";
import { isLikelySigningToken } from "@/lib/esign/token";
import { DOC_LABEL, ROLE_LABEL, type SigningRequest } from "@/lib/esign/types";
import { Container, SectionLabel } from "@/components/ui/container";
import { renderDocument } from "@/lib/templates/render";
import type { DocumentVariables } from "@/lib/templates/types";
import { SUPPORTED_STATES } from "@/lib/compliance";
import { SignForm } from "./_components/sign-form";

export const dynamic = "force-dynamic";

interface RawRow {
  id: string;
  token: string;
  deal_id: string;
  doc_type: SigningRequest["docType"];
  signer_role: SigningRequest["signerRole"];
  signer_name: string | null;
  signer_email: string | null;
  status: SigningRequest["status"];
  signature_png: string | null;
  typed_name: string | null;
  consent: boolean;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  viewed_at: string | null;
  signed_at: string | null;
  expires_at: string;
}

interface RawDeal {
  draft: Record<string, unknown> | null;
  state: string | null;
  status: string | null;
}

async function fetchSigning(token: string): Promise<{ request: RawRow; deal: RawDeal | null } | null> {
  if (!useSupabase) return null;
  const env = serverEnv();
  const sb = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data: req } = await sb
    .from("signing_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle<RawRow>();
  if (!req) return null;
  if (req.status === "pending") {
    await sb
      .from("signing_requests")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", req.id);
  }
  const { data: deal } = await sb
    .from("deals")
    .select("draft, state, status")
    .eq("id", req.deal_id)
    .maybeSingle<RawDeal>();
  return { request: req, deal };
}

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isLikelySigningToken(token)) notFound();

  if (!useSupabase) {
    return (
      <main className="min-h-screen bg-bone py-16">
        <Container>
          <SectionLabel>E-sign · Disabled</SectionLabel>
          <h1 className="font-display text-3xl text-ink mt-2">
            E-signing is not enabled on this deployment.
          </h1>
        </Container>
      </main>
    );
  }

  const result = await fetchSigning(token);
  if (!result) notFound();
  const { request, deal } = result;

  const expired = new Date(request.expires_at) < new Date();
  const alreadySigned = request.status === "signed";

  const docPreview = renderPreview(request.doc_type, deal);

  return (
    <main className="min-h-screen bg-bone py-10 sm:py-14">
      <Container className="max-w-[860px]">
        <header className="mb-8">
          <SectionLabel>
            Wholesail · {DOC_LABEL[request.doc_type]} · {ROLE_LABEL[request.signer_role]} signature
          </SectionLabel>
          <h1 className="font-display text-3xl sm:text-4xl text-ink mt-2 leading-[1.1] tracking-tight">
            {request.signer_name
              ? `${request.signer_name}, please review and sign.`
              : "Please review and sign."}
          </h1>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            This signing link was sent to you by the Wholesail account holder.
            Read the document below, then add your signature at the bottom of
            the page. Your signature, the date, your IP, and your browser are
            recorded for the audit trail.
          </p>
        </header>

        <section className="rounded-[10px] border border-rule bg-parchment overflow-hidden mb-8">
          <div className="bg-forest-900 text-bone px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass-300">
              Document preview
            </span>
            <span className="text-sm font-medium">
              {DOC_LABEL[request.doc_type]}
            </span>
          </div>
          <article className="px-6 sm:px-10 py-8 max-h-[520px] overflow-y-auto">
            {docPreview ? (
              <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink font-display tracking-tight">
                {docPreview}
              </pre>
            ) : (
              <p className="text-sm text-ink-faint italic">
                Document preview unavailable. The party that sent this link
                will share the final document at closing.
              </p>
            )}
          </article>
        </section>

        {alreadySigned ? (
          <div className="rounded-[10px] border border-forest-200 bg-forest-50 p-6">
            <h2 className="font-display text-2xl text-forest-700">
              Already signed.
            </h2>
            <p className="text-ink-soft mt-2 text-sm">
              This document was signed on{" "}
              {request.signed_at
                ? new Date(request.signed_at).toLocaleString()
                : "an earlier date"}
              . You can close this window.
            </p>
          </div>
        ) : expired ? (
          <div className="rounded-[10px] border border-clay-300 bg-clay-50 p-6">
            <h2 className="font-display text-2xl text-clay-600">
              This signing link has expired.
            </h2>
            <p className="text-ink-soft mt-2 text-sm">
              Contact the party that sent it to request a new link.
            </p>
          </div>
        ) : (
          <SignForm
            token={token}
            signerName={request.signer_name ?? ""}
          />
        )}

        <footer className="mt-12 text-[11px] text-ink-faint font-mono uppercase tracking-[0.14em]">
          Wholesail · Audit ref {request.id.slice(0, 8)}
        </footer>
      </Container>
    </main>
  );
}

function renderPreview(
  docType: SigningRequest["docType"],
  deal: RawDeal | null,
): string | null {
  if (!deal?.draft) return null;
  const d = deal.draft as Record<string, unknown>;
  const state = (d.state as string | undefined) ?? undefined;
  const strategy = (d.strategy as DocumentVariables["strategy"] | undefined) ?? undefined;
  const propertyAddress = (d.propertyAddress as string | undefined) ?? undefined;
  const propertyCity = (d.propertyCity as string | undefined) ?? undefined;
  const propertyZip = (d.propertyZip as string | undefined) ?? undefined;
  const askingPriceCents = (d.askingPriceCents as number | undefined) ?? undefined;
  if (!state || !strategy || !propertyAddress || !propertyCity || !propertyZip || askingPriceCents == null) {
    return null;
  }
  const stateName = SUPPORTED_STATES.find((s) => s.code === state)?.name ?? state;
  const vars: DocumentVariables = {
    state: state as DocumentVariables["state"],
    stateName,
    strategy,
    buyer: {
      name: (d.buyerName as string | undefined) || "[Buyer name]",
      entity: d.buyerEntity as string | undefined,
    },
    seller: { name: (d.sellerName as string | undefined) || "[Seller name]" },
    property: {
      address: propertyAddress,
      city: propertyCity,
      county: d.propertyCounty as string | undefined,
      zip: propertyZip,
      sqft: d.sqft as number | undefined,
      beds: d.beds as number | undefined,
      baths: d.baths as number | undefined,
      yearBuilt: d.yearBuilt as number | undefined,
    },
    terms: {
      purchasePriceCents: askingPriceCents,
      earnestMoneyCents: Math.max(100000, Math.round(askingPriceCents * 0.01)),
      earnestMoneyHolder: "the escrow agent agreed by the parties",
      closingDate: "[closing date]",
      offerExpirationDate: "[date]",
      inspectionPeriodDays: 10,
      assignmentFeeCents: d.assignmentFeeCents as number | undefined,
    },
    meta: {
      documentId: "WS-PREVIEW",
      executionDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      templateVersion: "2026.Q1",
      ruleSnapshotId: `${state}_2026_Q1`,
    },
  };
  try {
    return renderDocument(docType, vars).bodyMarkdown;
  } catch {
    return null;
  }
}
