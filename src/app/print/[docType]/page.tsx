"use client";

import * as React from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useDraft } from "@/app/app/deals/new/_lib/use-draft";
import { useDeals } from "@/lib/deals/store";
import { renderDocument } from "@/lib/templates/render";
import { SUPPORTED_STATES } from "@/lib/compliance";
import type { DocType, DocumentVariables } from "@/lib/templates/types";

const VALID: DocType[] = ["offer-letter", "psa", "assignment"];

export default function PrintDocumentPage({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType: raw } = use(params);
  const docType = VALID.includes(raw as DocType) ? (raw as DocType) : null;
  const searchParams = useSearchParams();
  const dealId = searchParams?.get("deal") ?? null;
  const { get } = useDeals();
  const { draft: wizardDraft } = useDraft();
  const savedDeal = dealId ? get(dealId) : undefined;
  const draft = savedDeal?.draft ?? wizardDraft;
  const [randId] = React.useState(
    () => `WS-${Math.floor(10000 + Math.random() * 89999)}`,
  );
  const docId = savedDeal?.id ?? randId;

  const vars: DocumentVariables | null = React.useMemo(() => {
    if (
      !draft.state ||
      !draft.strategy ||
      !draft.propertyAddress ||
      !draft.propertyCity ||
      !draft.propertyZip ||
      draft.askingPriceCents == null
    ) {
      return null;
    }
    const stateName =
      SUPPORTED_STATES.find((s) => s.code === draft.state)?.name ?? draft.state;
    return {
      state: draft.state,
      stateName,
      strategy: draft.strategy,
      buyer: { name: draft.buyerName || "[Buyer name]", entity: draft.buyerEntity },
      seller: { name: draft.sellerName || "[Seller name]" },
      property: {
        address: draft.propertyAddress,
        city: draft.propertyCity,
        county: draft.propertyCounty,
        zip: draft.propertyZip,
        sqft: draft.sqft,
        beds: draft.beds,
        baths: draft.baths,
        yearBuilt: draft.yearBuilt,
      },
      terms: {
        purchasePriceCents: draft.askingPriceCents,
        earnestMoneyCents: Math.max(100000, Math.round(draft.askingPriceCents * 0.01)),
        earnestMoneyHolder: "the escrow agent agreed by the parties",
        closingDate: "[closing date]",
        offerExpirationDate: "[date]",
        inspectionPeriodDays: 10,
        assignmentFeeCents: draft.assignmentFeeCents,
      },
      meta: {
        documentId: docId,
        executionDate: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        templateVersion: "2026.Q1",
        ruleSnapshotId: `${draft.state}_2026_Q1`,
      },
    };
  }, [draft, docId]);

  const rendered = React.useMemo(() => {
    if (!docType || !vars) return null;
    try {
      return renderDocument(docType, vars);
    } catch {
      return null;
    }
  }, [docType, vars]);

  const triggered = React.useRef(false);
  React.useEffect(() => {
    if (!rendered || triggered.current) return;
    triggered.current = true;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [rendered]);

  if (!docType) {
    return (
      <div className="p-10">
        <p>Unknown document type.</p>
      </div>
    );
  }

  if (!rendered) {
    return (
      <div className="p-10">
        <p>No draft found. Return to the wizard and complete the deal.</p>
      </div>
    );
  }

  return (
    <article className="doc">
      <header className="doc-head">
        <div className="doc-brand">
          <span className="doc-brand-mark">◆</span>
          <span className="doc-brand-name">WHOLESAIL</span>
        </div>
        <div className="doc-meta">
          <div>
            <span className="doc-meta-label">Doc ID</span>
            <span className="doc-meta-val">{rendered.variables.meta.documentId}</span>
          </div>
          <div>
            <span className="doc-meta-label">Template</span>
            <span className="doc-meta-val">v{rendered.variables.meta.templateVersion}</span>
          </div>
          <div>
            <span className="doc-meta-label">Rules</span>
            <span className="doc-meta-val">{rendered.variables.meta.ruleSnapshotId}</span>
          </div>
        </div>
      </header>
      <div className="doc-title">
        <div className="doc-title-overline">
          {rendered.variables.stateName} · {rendered.variables.strategy}
        </div>
        <h1>{rendered.title}</h1>
      </div>
      <section className="doc-body">
        <Markdown text={rendered.bodyMarkdown} />
      </section>
      <footer className="doc-footer">
        <div className="doc-disclaimer">
          <div className="doc-disclaimer-label">Attorney review notice</div>
          <p>{rendered.disclaimer}</p>
        </div>
        <div className="doc-footer-meta">
          <span>Generated {rendered.variables.meta.executionDate}</span>
          <span className="doc-footer-page">Page <span className="doc-pnum" /></span>
        </div>
      </footer>

      <div className="no-print doc-actions">
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <a href="/app/deals/new">← Back to wizard</a>
      </div>
    </article>
  );
}

function Markdown({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseMarkdown(text), [text]);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <h2 key={i} className="doc-h">
              <Inline text={b.text} />
            </h2>
          );
        }
        if (b.kind === "quote") {
          return (
            <blockquote key={i} className="doc-quote">
              <Inline text={b.text} />
            </blockquote>
          );
        }
        if (b.kind === "hr") {
          return <hr key={i} className="doc-hr" />;
        }
        return (
          <p key={i} className="doc-p">
            <Inline text={b.text} />
          </p>
        );
      })}
    </>
  );
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "hr" };

function parseMarkdown(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let buf: string[] = [];
  const flushPara = () => {
    const joined = buf.join(" ").trim();
    buf = [];
    if (!joined) return;
    const leadingBold = joined.match(/^\*\*([^*]+)\*\*\s*$/);
    if (leadingBold) {
      blocks.push({ kind: "heading", text: leadingBold[1] });
    } else {
      blocks.push({ kind: "para", text: joined });
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (t === "") {
      flushPara();
      continue;
    }
    if (t === "---") {
      flushPara();
      blocks.push({ kind: "hr" });
      continue;
    }
    if (t.startsWith("> ")) {
      flushPara();
      blocks.push({ kind: "quote", text: t.slice(2) });
      continue;
    }
    buf.push(t);
  }
  flushPara();
  return blocks;
}

function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let idx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > idx) parts.push(text.slice(idx, m.index));
    parts.push(<strong key={key++}>{m[1]}</strong>);
    idx = re.lastIndex;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return <>{parts}</>;
}
