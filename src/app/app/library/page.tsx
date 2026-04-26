"use client";

import * as React from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Container, SectionLabel } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeals, type SavedDeal } from "@/lib/deals/store";
import { useFirmSigningRequests } from "@/lib/esign/store";
import {
  DOC_LABEL,
  type DocType,
  type SigningRequest,
  type SigningStatus,
} from "@/lib/esign/types";
import { renderDocument } from "@/lib/templates/render";
import type { DocumentVariables } from "@/lib/templates/types";
import { SUPPORTED_STATES } from "@/lib/compliance";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DOC_TYPES: DocType[] = ["offer-letter", "psa", "assignment"];

type Filter = "all" | "drafted" | "sent" | "signed" | "expired";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafted", label: "Drafted" },
  { key: "sent", label: "Sent" },
  { key: "signed", label: "Signed" },
  { key: "expired", label: "Expired" },
];

interface DealDocsRow {
  deal: SavedDeal;
  drafted: Set<DocType>;
  byDocSigning: Record<DocType, SigningRequest[]>;
  topStatus: SigningStatus | "drafted" | "none";
  signedCount: number;
  pendingCount: number;
}

export default function LibraryPage() {
  const { deals, loading: loadingDeals } = useDeals();
  const { requests, loading: loadingReqs } = useFirmSigningRequests();
  const [filter, setFilter] = React.useState<Filter>("all");

  const rows = React.useMemo<DealDocsRow[]>(() => {
    return deals.map((deal) => {
      const drafted = new Set<DocType>();
      for (const t of DOC_TYPES) {
        if (canRender(deal, t)) drafted.add(t);
      }
      const dealReqs = requests.filter((r) => r.dealId === deal.id);
      const byDocSigning: Record<DocType, SigningRequest[]> = {
        "offer-letter": [],
        psa: [],
        assignment: [],
      };
      for (const r of dealReqs) byDocSigning[r.docType].push(r);
      const signedCount = dealReqs.filter((r) => r.status === "signed").length;
      const pendingCount = dealReqs.filter(
        (r) => r.status === "pending" || r.status === "viewed",
      ).length;
      const topStatus: DealDocsRow["topStatus"] = signedCount
        ? "signed"
        : pendingCount
          ? "viewed"
          : drafted.size
            ? "drafted"
            : "none";
      return {
        deal,
        drafted,
        byDocSigning,
        topStatus,
        signedCount,
        pendingCount,
      };
    });
  }, [deals, requests]);

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (filter === "all") return true;
      if (filter === "drafted") return r.drafted.size > 0 && r.topStatus !== "signed";
      if (filter === "sent") return r.pendingCount > 0;
      if (filter === "signed") return r.signedCount > 0;
      if (filter === "expired")
        return Object.values(r.byDocSigning).some((arr) =>
          arr.some((req) => req.status === "expired"),
        );
      return true;
    });
  }, [rows, filter]);

  const totals = React.useMemo(() => {
    return {
      drafts: rows.reduce((n, r) => n + r.drafted.size, 0),
      sent: requests.length,
      signed: requests.filter((r) => r.status === "signed").length,
    };
  }, [rows, requests]);

  const loading = loadingDeals || loadingReqs;

  const root = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (headerRef.current && !reduce) {
        gsap.from(
          headerRef.current.querySelectorAll<HTMLElement>("[data-anim]"),
          {
            y: 18,
            autoAlpha: 0,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.08,
          },
        );
      }

      if (!gridRef.current || reduce) return;
      const rows = Array.from(
        gridRef.current.querySelectorAll<HTMLElement>("[data-row]"),
      );
      if (rows.length === 0) return;
      gsap.set(rows, { y: 32, autoAlpha: 0 });
      ScrollTrigger.batch(rows, {
        start: "top 92%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });
    },
    { scope: root, dependencies: [filtered.length, loading] },
  );

  return (
    <div ref={root} className="py-10 sm:py-14">
      <Container>
        <header
          ref={headerRef}
          className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-10"
        >
          <div>
            <SectionLabel data-anim>Documents · Library</SectionLabel>
            <h1
              data-anim
              className="font-display text-4xl sm:text-5xl text-ink mt-2 leading-[1.05] tracking-tight"
            >
              Every doc on the desk.
            </h1>
            <p
              data-anim
              className="text-ink-soft mt-3 max-w-xl text-sm leading-relaxed"
            >
              Cross-deal view of starter templates and e-signature status.
              Click any deal to open its Documents tab and send for signature.
            </p>
          </div>
          <div className="flex gap-2" data-anim>
            <Stat label="Drafts" value={totals.drafts} />
            <Stat label="Sent" value={totals.sent} />
            <Stat label="Signed" value={totals.signed} tone="forest" />
          </div>
        </header>

        <div className="flex items-center gap-1 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-xs uppercase tracking-[0.14em] font-mono font-medium rounded-[4px] border transition-colors",
                filter === f.key
                  ? "bg-forest-900 text-bone border-forest-900"
                  : "border-rule text-ink-soft hover:text-ink hover:border-forest-200",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-ink-faint font-mono uppercase tracking-[0.14em]">
            {filtered.length} of {rows.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-[10px] border border-rule bg-parchment p-12 text-center text-sm text-ink-faint">
            Loading library…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState all={rows.length === 0} />
        ) : (
          <div ref={gridRef} className="grid gap-3">
            {filtered.map((r) => (
              <LibraryRow key={r.deal.id} row={r} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function LibraryRow({ row }: { row: DealDocsRow }) {
  const { deal, drafted, byDocSigning, signedCount, pendingCount } = row;
  const d = deal.draft;
  const addr = d.propertyAddress
    ? `${d.propertyAddress}${d.propertyCity ? `, ${d.propertyCity}` : ""}${d.propertyZip ? ` ${d.propertyZip}` : ""}`
    : "Untitled deal";

  return (
    <Link
      data-row
      href={`/app/deals/${deal.id}`}
      className="block rounded-[10px] border border-rule bg-parchment hover:border-forest-200 transition-colors p-5"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[11px] uppercase tracking-[0.14em] text-brass-700 font-mono font-medium">
              {d.state ?? "??"} · {d.strategy?.toUpperCase() ?? "—"}
            </span>
            <span className="text-[10px] text-ink-faint font-mono">
              {deal.id}
            </span>
          </div>
          <h3 className="font-display text-xl text-ink leading-tight">
            {addr}
          </h3>
          <div className="mt-3 grid sm:grid-cols-3 gap-2">
            {DOC_TYPES.map((t) => (
              <DocCell
                key={t}
                docType={t}
                drafted={drafted.has(t)}
                requests={byDocSigning[t]}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          {signedCount > 0 && (
            <Badge tone="forest">
              {signedCount} signed
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge tone="brass">
              {pendingCount} pending
            </Badge>
          )}
          {signedCount === 0 && pendingCount === 0 && drafted.size > 0 && (
            <Badge tone="neutral">Draft only</Badge>
          )}
          {drafted.size === 0 && (
            <Badge tone="clay">Incomplete deal</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function DocCell({
  docType,
  drafted,
  requests,
}: {
  docType: DocType;
  drafted: boolean;
  requests: SigningRequest[];
}) {
  const signed = requests.find((r) => r.status === "signed");
  const pending = requests.find(
    (r) => r.status === "pending" || r.status === "viewed",
  );
  const expired = requests.find((r) => r.status === "expired");

  let tone: "forest" | "brass" | "clay" | "muted" = "muted";
  let label = "—";
  if (signed) {
    tone = "forest";
    label = "Signed";
  } else if (pending) {
    tone = "brass";
    label = pending.status === "viewed" ? "Viewed" : "Sent";
  } else if (expired) {
    tone = "clay";
    label = "Expired";
  } else if (drafted) {
    tone = "muted";
    label = "Drafted";
  } else {
    tone = "muted";
    label = "Unavailable";
  }

  return (
    <div
      className={cn(
        "rounded-[6px] border px-3 py-2 text-xs",
        tone === "forest" && "border-forest-200 bg-forest-50 text-forest-700",
        tone === "brass" && "border-brass-100 bg-brass-50 text-brass-700",
        tone === "clay" && "border-[#e8c9bc] bg-[#f4e0d8] text-clay-600",
        tone === "muted" && "border-rule bg-bone text-ink-soft",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] font-mono opacity-70">
        {DOC_LABEL[docType]}
      </div>
      <div className="font-medium mt-0.5">{label}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "forest";
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border px-4 py-2 bg-parchment min-w-[88px]",
        tone === "forest" ? "border-forest-200" : "border-rule",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.16em] text-brass-700 font-medium">
        {label}
      </div>
      <div
        className={cn(
          "font-mono tabular-nums text-xl mt-0.5",
          tone === "forest" ? "text-forest-700" : "text-ink",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ all }: { all: boolean }) {
  return (
    <div className="rounded-[10px] border border-rule bg-parchment p-12 text-center">
      <h3 className="font-display text-2xl text-ink">
        {all ? "No deals on the desk yet." : "Nothing matches that filter."}
      </h3>
      <p className="text-ink-soft mt-2 text-sm max-w-md mx-auto">
        {all
          ? "Run a deal through the wizard. Once you fill price, address, and strategy, starter templates appear here."
          : "Switch the filter or generate a starter template from any deal's Documents tab."}
      </p>
      {all && (
        <Link href="/app/deals/new" className="inline-block mt-5">
          <Button variant="primary">Start a deal</Button>
        </Link>
      )}
    </div>
  );
}

function canRender(deal: SavedDeal, docType: DocType): boolean {
  const d = deal.draft;
  if (
    !d.state ||
    !d.strategy ||
    !d.propertyAddress ||
    !d.propertyCity ||
    !d.propertyZip ||
    d.askingPriceCents == null
  ) {
    return false;
  }
  if (docType === "assignment" && d.strategy !== "wholesale") return false;
  const stateName =
    SUPPORTED_STATES.find((s) => s.code === d.state)?.name ?? d.state;
  const vars: DocumentVariables = {
    state: d.state,
    stateName,
    strategy: d.strategy,
    buyer: { name: d.buyerName || "[Buyer]", entity: d.buyerEntity },
    seller: { name: d.sellerName || "[Seller]" },
    property: {
      address: d.propertyAddress,
      city: d.propertyCity,
      county: d.propertyCounty,
      zip: d.propertyZip,
      sqft: d.sqft,
      beds: d.beds,
      baths: d.baths,
      yearBuilt: d.yearBuilt,
    },
    terms: {
      purchasePriceCents: d.askingPriceCents,
      earnestMoneyCents: Math.max(100000, Math.round(d.askingPriceCents * 0.01)),
      earnestMoneyHolder: "the escrow agent agreed by the parties",
      closingDate: "[closing date]",
      offerExpirationDate: "[date]",
      inspectionPeriodDays: 10,
      assignmentFeeCents: d.assignmentFeeCents,
    },
    meta: {
      documentId: "WS-LIB",
      executionDate: new Date().toLocaleDateString("en-US"),
      templateVersion: "2026.Q1",
      ruleSnapshotId: `${d.state}_2026_Q1`,
    },
  };
  try {
    renderDocument(docType, vars);
    return true;
  } catch {
    return false;
  }
}
