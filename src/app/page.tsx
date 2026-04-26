import Link from "next/link";
import { HeroReveal } from "./_components/hero-reveal";
import { PricingReveal } from "./_components/pricing-reveal";

const NAV = [
  { label: "Home", href: "/", active: true },
  { label: "Workflow", href: "/overview#how" },
  { label: "Coverage", href: "/overview#states" },
  { label: "Pricing", href: "#pricing" },
  { label: "Journal", href: "/overview#faq" },
];

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default function CinematicHero() {
  return (
    <main data-theme="cinematic" className="relative">
      {/* ─────────────────────────────────────────────────────────────
         HERO — fullscreen video + nav + headline
         ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(1200px 700px at 50% 40%, rgba(0,20,40,0) 0%, rgba(0,15,30,0.35) 60%, rgba(0,15,30,0.72) 100%)",
          }}
        />

        <nav className="relative z-10 flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-3xl tracking-tight leading-none text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Wholesail<sup className="text-xs">®</sup>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {NAV.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className={`text-sm transition-colors ${
                    l.active ? "text-white" : "text-muted-fg hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] active:scale-[0.98]"
          >
            Begin Journey
          </Link>
        </nav>

        <HeroReveal />
      </section>

      {/* ─────────────────────────────────────────────────────────────
         PRICING — dark continuation, liquid-glass tier cards
         ───────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative py-28 md:py-36 px-6"
        style={{
          background:
            "linear-gradient(180deg, hsl(201 100% 13%) 0%, hsl(201 100% 9%) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-[11px] uppercase tracking-[0.32em] text-white/40 mb-4">
              Pricing · Free during beta
            </div>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[1.02] text-white max-w-3xl mx-auto"
              style={{
                fontFamily: "'Instrument Serif', serif",
                letterSpacing: "-1.6px",
              }}
            >
              Start free.{" "}
              <em className="not-italic text-muted-fg">
                Grow when you&rsquo;re ready.
              </em>
            </h2>
            <p className="text-muted-fg mt-6 max-w-xl mx-auto leading-relaxed">
              The ledger is open to everyone during beta. Paid tiers unlock
              when Wholesail covers your state portfolio and your team size.
            </p>
          </div>

          <PricingReveal>
            {TIERS.map((t) => (
              <TierCard key={t.name} tier={t} />
            ))}
          </PricingReveal>

          <p className="text-center text-xs text-white/30 mt-14">
            Taxes calculated at checkout where applicable. Wholesail is a
            software tool, not a law firm.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         FOOTER — dark, minimal
         ───────────────────────────────────────────────────────────── */}
      <footer
        className="relative border-t border-white/10"
        style={{ background: "hsl(201 100% 9%)" }}
      >
        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span
              className="text-lg text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Wholesail<sup className="text-[9px]">®</sup>
            </span>
            <span className="ml-4">
              © 2026. Not a law firm. Not legal advice.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/overview" className="hover:text-white transition-colors">
              Full overview
            </Link>
            <Link href="/signin" className="hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/app" className="hover:text-white transition-colors inline-flex items-center gap-2">
              Open dashboard
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ────────────────────────── pricing data ──────────────────────── */

type Tier = {
  name: string;
  tagline: string;
  priceLabel: string;
  priceSub?: string;
  ctaLabel: string;
  ctaHref: string;
  ctaDisabled?: boolean;
  highlight?: boolean;
  features: string[];
  note?: string;
};

const TIERS: Tier[] = [
  {
    name: "Beta",
    tagline: "For the first wave of dealmakers.",
    priceLabel: "Free",
    priceSub: "while we’re in beta",
    ctaLabel: "Begin Journey",
    ctaHref: "/signup",
    features: [
      "All 15 supported states",
      "Wholesale · Flip · Hold analysis",
      "Unlimited deals on the ledger",
      "Starter paperwork (LOI, PSA, Assignment)",
      "Branded PDF exports",
    ],
  },
  {
    name: "Operator",
    tagline: "For solo investors closing monthly.",
    priceLabel: "$29",
    priceSub: "per month · coming soon",
    ctaLabel: "Join waitlist",
    ctaHref: "/signup?plan=operator",
    highlight: true,
    features: [
      "Everything in Beta",
      "White-label PDFs (your logo)",
      "9 state coverage by Q3",
      "Inline e-signature (upcoming)",
      "Priority support",
    ],
    note: "First month on us when Operator goes live.",
  },
  {
    name: "Desk",
    tagline: "For teams running multiple dispositions.",
    priceLabel: "Talk to us",
    priceSub: "per-seat pricing",
    ctaLabel: "Request access",
    ctaHref: "mailto:hello@wholesail.co?subject=Desk%20tier%20access",
    features: [
      "Everything in Operator",
      "Unlimited seats",
      "Shared pipeline + comments",
      "Audit log + SOC-style exports",
      "Custom state buildouts",
    ],
  },
];

function TierCard({ tier }: { tier: Tier }) {
  const isMailto = tier.ctaHref.startsWith("mailto:");
  return (
    <div
      className={`relative flex flex-col p-7 rounded-[18px] ${
        tier.highlight
          ? "liquid-glass bg-white/[0.03]"
          : "border border-white/10 bg-white/[0.015]"
      }`}
    >
      {tier.highlight && (
        <span
          className="absolute -top-3 left-7 text-[10px] uppercase tracking-[0.22em] text-black bg-white px-3 py-1 rounded-full font-medium"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Recommended
        </span>
      )}

      <div className="flex items-baseline justify-between mb-1">
        <h3
          className="text-2xl text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {tier.name}
        </h3>
      </div>
      <p className="text-sm text-muted-fg leading-relaxed">{tier.tagline}</p>

      <div className="mt-7 flex items-baseline gap-2">
        <span
          className="text-5xl text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {tier.priceLabel}
        </span>
      </div>
      {tier.priceSub && (
        <span
          className="text-[11px] uppercase tracking-[0.18em] text-muted-fg mt-2"
          dangerouslySetInnerHTML={{ __html: tier.priceSub }}
        />
      )}

      <ul className="mt-8 space-y-3 text-sm text-white/80 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2.5 items-start">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="mt-0.5 text-white/50 flex-none"
            >
              <path d="M3 8l3.5 3.5L13 5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {tier.note && (
        <p className="mt-6 text-xs italic text-muted-fg leading-relaxed">
          {tier.note}
        </p>
      )}

      <div className="mt-8">
        {isMailto ? (
          <a
            href={tier.ctaHref}
            className="block text-center w-full liquid-glass rounded-full px-6 py-3.5 text-sm text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {tier.ctaLabel}
          </a>
        ) : (
          <Link
            href={tier.ctaHref}
            className={`block text-center w-full rounded-full px-6 py-3.5 text-sm transition-all ${
              tier.highlight
                ? "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
                : "liquid-glass text-white hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {tier.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
