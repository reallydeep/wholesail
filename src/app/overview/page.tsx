import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Container, SectionLabel } from "@/components/ui/container";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealSheetPreview } from "./_components/deal-sheet-preview";

export default function LandingPage() {
  return (
    <>
      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <header className="border-b border-rule/60">
        <Container className="h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
            <Link href="#how" className="hover:text-ink transition-colors">How it works</Link>
            <Link href="#strategies" className="hover:text-ink transition-colors">Strategies</Link>
            <Link href="#states" className="hover:text-ink transition-colors">Coverage</Link>
            <Link href="#faq" className="hover:text-ink transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/app/deals/new">
              <Button variant="primary" size="sm">Start a deal</Button>
            </Link>
          </div>
        </Container>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.55]"
          aria-hidden
          style={{
            background:
              "radial-gradient(1000px 500px at 20% 0%, rgba(176,141,87,0.18), transparent 60%), radial-gradient(800px 400px at 85% 20%, rgba(36,74,51,0.10), transparent 60%)",
          }}
        />

        <Container className="pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-16 items-start">
            <div className="animate-rise">
              <SectionLabel>A tool for dealmakers</SectionLabel>

              <h1 className="font-display text-[56px] md:text-[84px] leading-[0.95] tracking-[-0.025em] text-ink mt-6">
                Lock the handshake.
                <br />
                <span className="italic text-forest-700">Your attorney</span>
                <br />
                takes it home.
              </h1>

              <p className="text-lg md:text-xl text-ink-soft mt-8 max-w-xl leading-relaxed">
                Wholesail analyzes the deal, runs the numbers, and hands you
                clean starter paperwork for <strong className="text-ink font-medium">Wholesale</strong>,{" "}
                <strong className="text-ink font-medium">Fix &amp; Flip</strong>, and{" "}
                <strong className="text-ink font-medium">Buy &amp; Hold</strong>.
                When you shake, your attorney closes. That&rsquo;s the whole point.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/app/deals/new">
                  <Button variant="primary" size="xl">
                    Analyze a property
                    <Arrow />
                  </Button>
                </Link>
                <Link href="#how">
                  <Button variant="outline" size="xl">
                    See how it works
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-4 text-xs text-ink-faint">
                <span className="deco-diamond">Free during beta</span>
                <span className="h-3 w-px bg-rule-strong" />
                <span>No card required</span>
                <span className="h-3 w-px bg-rule-strong" />
                <span>15 states live</span>
              </div>
            </div>

            <div className="animate-rise [animation-delay:150ms]">
              <DealSheetPreview />
            </div>
          </div>
        </Container>

        <div className="border-t border-rule/60" />
      </section>

      {/* ─── TRUST STRIP ─────────────────────────────────────────── */}
      <section className="bg-forest-900 text-bone overflow-hidden py-4">
        <div className="flex gap-16 whitespace-nowrap animate-[marquee_40s_linear_infinite]">
          {[...Array(2)].map((_, loop) => (
            <div key={loop} className="flex gap-16 shrink-0">
              {[
                "MAO calculator built-in",
                "State-aware paperwork",
                "Attorney-ready exports",
                "Wholesale · Flip · Hold",
                "Repair tier detection",
                "Pipeline that doesn't suck",
                "Free during beta",
              ].map((t) => (
                <span
                  key={t + loop}
                  className="font-display italic text-xl text-brass-300"
                >
                  — {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how" className="py-24 md:py-32">
        <Container>
          <div className="max-w-2xl">
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.98] tracking-tight mt-5">
              Four steps from<br/>
              <span className="italic text-forest-700">listing to handshake.</span>
            </h2>
          </div>

          <ol className="mt-16 grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="text-[11px] uppercase tracking-[0.18em] text-brass-700 font-medium flex items-center gap-2 mb-4">
                  <span className="font-mono text-ink-faint">0{i + 1}</span>
                  <span className="h-px flex-1 bg-rule-strong" />
                </div>
                <h3 className="font-display text-2xl leading-tight text-ink">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-soft mt-3 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ─── STRATEGIES ──────────────────────────────────────────── */}
      <section id="strategies" className="py-24 md:py-32 bg-surface-sunk/60 border-y border-rule">
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
            <div className="max-w-2xl">
              <SectionLabel>Three ways to make money</SectionLabel>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.98] tracking-tight mt-5">
                Every deal, the right<br/>
                <span className="italic text-forest-700">math &amp; paper.</span>
              </h2>
            </div>
            <p className="text-ink-soft max-w-sm text-sm leading-relaxed">
              Pick a strategy at intake. Wholesail runs the correct analysis and
              generates the correct starter documents. No wrong forms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STRATEGIES.map((s) => (
              <Card key={s.name} className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <Badge tone={s.tone}>{s.kind}</Badge>
                  <span className="font-mono text-xs text-ink-faint">
                    {s.code}
                  </span>
                </div>
                <CardTitle className="text-3xl">{s.name}</CardTitle>
                <CardSubtitle className="mt-3 text-base leading-relaxed">
                  {s.tagline}
                </CardSubtitle>

                <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="text-brass-500 font-mono">◆</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 pt-5 border-t border-rule">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                    Math applied
                  </div>
                  <div className="font-mono text-xs text-ink mt-1.5">
                    {s.formula}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── STATE COVERAGE ──────────────────────────────────────── */}
      <section id="states" className="py-24 md:py-32">
        <Container>
          <div className="max-w-2xl">
            <SectionLabel>Launch coverage</SectionLabel>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.98] tracking-tight mt-5">
              Ohio. Pennsylvania. Florida.
            </h2>
            <p className="text-ink-soft mt-6 text-lg max-w-xl leading-relaxed">
              We ship starter paper with state-aware clauses and warnings for
              the three markets we launch in. More states follow monthly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-14">
            {STATES.map((st) => (
              <Card key={st.abbr} className="p-7 relative overflow-hidden">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="font-mono text-xs text-ink-faint tracking-wider">
                      {st.abbr}
                    </div>
                    <div className="font-display text-3xl text-ink mt-1">
                      {st.name}
                    </div>
                  </div>
                  <Badge tone={st.confidenceTone}>{st.confidence}</Badge>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  {st.rules.map((r) => (
                    <div key={r.label} className="flex justify-between items-start gap-4 py-1.5 border-b border-rule last:border-0">
                      <span className="text-ink-soft">{r.label}</span>
                      <span className={`font-medium ${r.positive ? "text-forest-700" : "text-clay-600"}`}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-ink-faint leading-relaxed italic">
                  {st.note}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-sm text-ink-soft flex items-center gap-2">
            <span className="deco-diamond" />
            Next up: Texas, Georgia, North Carolina, Michigan, Tennessee.
          </div>
        </Container>
      </section>

      {/* ─── HANDSHAKE BAND ──────────────────────────────────────── */}
      <section className="relative py-28 md:py-40 bg-forest-900 text-bone overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 -z-10"
          aria-hidden
          style={{
            background:
              "radial-gradient(600px 400px at 30% 50%, rgba(176,141,87,0.25), transparent 70%)",
          }}
        />
        <Container className="max-w-4xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-brass-300 font-medium flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-brass-300" />
            Our line
          </div>
          <h2 className="font-display text-[56px] md:text-[96px] leading-[0.94] tracking-[-0.02em] mt-8">
            We put the deal
            <br />
            <em className="text-brass-300">on paper.</em>
            <br />
            Your attorney
            <br />
            <em className="text-brass-300">closes the deal.</em>
          </h2>
          <p className="mt-10 text-lg md:text-xl text-bone/80 max-w-2xl leading-relaxed">
            Wholesail is not a law firm. Every document we generate is a
            starter template with a plain-English disclaimer: before anyone
            signs, hand it to a licensed attorney in your state. That&rsquo;s the
            only way this works &mdash; and it&rsquo;s the only way we&rsquo;ll work.
          </p>
        </Container>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 md:py-32">
        <Container className="max-w-4xl">
          <SectionLabel>Common questions</SectionLabel>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.98] tracking-tight mt-5">
            Answers up front.
          </h2>

          <dl className="mt-14 divide-y divide-rule">
            {FAQ.map((qa) => (
              <div key={qa.q} className="py-8 grid md:grid-cols-[280px_1fr] gap-6">
                <dt className="font-display text-xl text-ink leading-tight">
                  {qa.q}
                </dt>
                <dd className="text-ink-soft leading-relaxed">{qa.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="pb-24 md:pb-32">
        <Container>
          <div className="rounded-[16px] bg-ink text-bone p-10 md:p-16 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              aria-hidden
              style={{
                background:
                  "radial-gradient(400px 300px at 80% 20%, rgba(176,141,87,0.5), transparent 60%)",
              }}
            />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-10 items-end">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brass-300 font-medium flex items-center gap-2">
                  <span className="inline-block w-6 h-px bg-brass-300" />
                  Free during beta
                </div>
                <h3 className="font-display text-4xl md:text-6xl leading-[0.98] tracking-tight mt-5 max-w-xl">
                  Put your next deal on paper.
                </h3>
                <p className="mt-5 text-bone/70 max-w-md">
                  Five-minute intake. Starter paperwork in one click. Hand it
                  to your attorney to close.
                </p>
              </div>
              <Link href="/app/deals/new">
                <Button variant="brass" size="xl">
                  Analyze a property
                  <Arrow />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-rule py-12">
        <Container>
          <div className="grid md:grid-cols-[1fr_2fr] gap-10">
            <div>
              <Logo />
              <p className="text-xs text-ink-faint mt-4 max-w-xs leading-relaxed">
                Wholesail is a software tool for real estate investors. We are
                not a law firm and do not provide legal advice. Retain a
                licensed attorney in your state before executing any
                agreement.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">Product</div>
                <ul className="space-y-2 text-ink-soft">
                  <li><Link href="#how" className="hover:text-ink">How it works</Link></li>
                  <li><Link href="#strategies" className="hover:text-ink">Strategies</Link></li>
                  <li><Link href="#states" className="hover:text-ink">Coverage</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">Company</div>
                <ul className="space-y-2 text-ink-soft">
                  <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
                  <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
                  <li><Link href="/disclaimer" className="hover:text-ink">Legal disclaimer</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">Build</div>
                <ul className="space-y-2 text-ink-soft">
                  <li>v0.1 — beta</li>
                  <li>Made by dealmakers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-rule text-xs text-ink-faint">
            &copy; 2026 Wholesail. All rights reserved. &nbsp;·&nbsp; Not legal advice. Not a brokerage.
          </div>
        </Container>
      </footer>
    </>
  );
}

const STEPS = [
  { title: "Pick a strategy.", body: "Wholesale, Fix & Flip, or Buy & Hold. We run the right math and pull the right template set." },
  { title: "Enter the property.", body: "Address, beds, baths, ARV, repair notes. Paste Zillow remarks; we'll parse what we can." },
  { title: "Get the analysis.", body: "MAO, margin, repair tier, and a Pass / Review / Pursue call — with the three reasons why." },
  { title: "Generate the paper.", body: "Offer letter, PSA, assignment. Branded PDF with your logo. Hand it to your attorney." },
];

const STRATEGIES = [
  {
    kind: "Speed play",
    tone: "forest" as const,
    code: "§ 01",
    name: "Wholesale",
    tagline: "Lock the contract. Assign to an end buyer. Keep the spread.",
    bullets: [
      "70% rule MAO with tunable multiplier",
      "Assignment fee modeled into profit spread",
      "State warnings for assignment restrictions",
    ],
    formula: "MAO = (ARV × 0.70) − repairs − fee",
  },
  {
    kind: "Capital play",
    tone: "brass" as const,
    code: "§ 02",
    name: "Fix & Flip",
    tagline: "Rehab, resell, book the margin. Hold time matters.",
    bullets: [
      "Holding + selling cost baked in (default 14% ARV)",
      "Repair tier keyword detection (roof, HVAC, etc.)",
      "Net profit target ≥ 15% ARV or $30k",
    ],
    formula: "Net = ARV − buy − repair − holding − selling",
  },
  {
    kind: "Cash-flow play",
    tone: "forest" as const,
    code: "§ 03",
    name: "Buy & Hold",
    tagline: "Underwrite for yield. Income, not hope.",
    bullets: [
      "50% rule NOI + per-door cash flow",
      "Cap rate and cash-on-cash return",
      "Flags when rent doesn't service PITI",
    ],
    formula: "CoC = annual cash flow ÷ cash invested",
  },
];

const STATES = [
  {
    abbr: "OH",
    name: "Ohio",
    confidence: "High confidence",
    confidenceTone: "forest" as const,
    rules: [
      { label: "Assignment", value: "Permitted", positive: true },
      { label: "Disclosure required", value: "Yes — intent to assign", positive: true },
      { label: "License threshold", value: "None set", positive: true },
      { label: "Attorney at close", value: "Strongly advised", positive: true },
    ],
    note: "Clean default flow. Watch distressed-seller dynamics; disclose assignment intent up front.",
  },
  {
    abbr: "PA",
    name: "Pennsylvania",
    confidence: "Medium confidence",
    confidenceTone: "brass" as const,
    rules: [
      { label: "Assignment", value: "Permitted with disclosure", positive: true },
      { label: "Seller consent", value: "Best practice", positive: true },
      { label: "Attorney at close", value: "Customary", positive: true },
      { label: "Regulation watch", value: "Active 2025–2026", positive: false },
    ],
    note: "PA traditionally closes with an attorney. We generate language that lives comfortably in that workflow.",
  },
  {
    abbr: "FL",
    name: "Florida",
    confidence: "High confidence",
    confidenceTone: "forest" as const,
    rules: [
      { label: "Assignment", value: "Permitted", positive: true },
      { label: "License threshold", value: "None set", positive: true },
      { label: "Cancelation rights", value: "None statutory", positive: true },
      { label: "Chapter 475 awareness", value: "Built in", positive: true },
    ],
    note: "Most investor-friendly of the three. Large market, active wholesaler community.",
  },
];

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

const FAQ = [
  {
    q: "Is Wholesail a law firm?",
    a: "No. Wholesail is a software tool. Every document we generate is a starter template you hand to a licensed attorney in your state before anyone signs. We say that on the landing page, in the app, and on every PDF we produce.",
  },
  {
    q: "Is this free?",
    a: "Yes, during beta. We may add a paid tier later for teams or white-label PDFs. You'll never lose access to deals you've already created.",
  },
  {
    q: "Which states are supported?",
    a: "Ohio, Pennsylvania, and Florida at launch, with state-aware clauses and warnings. Texas, Georgia, Tennessee, and Michigan are next.",
  },
  {
    q: "What does the analysis actually compute?",
    a: "Strategy-specific math. Wholesale: MAO via the 70% rule minus repairs minus your assignment fee. Flip: net profit with holding and selling costs. Hold: NOI, cap rate, cash-on-cash, per-door cash flow. Plus a Pursue / Review / Pass decision with the top three reasons.",
  },
  {
    q: "How do you decide the repair tier?",
    a: "Per-square-foot bands (Low / Medium / High) starting from your condition rating, then adjusted by keyword detection in your repair notes. Words like roof, foundation, mold, or fire bump you up; cosmetic-only keeps you down.",
  },
  {
    q: "What legal risk am I taking?",
    a: "The same risk you'd take assigning any contract. Our job is to reduce it: we disclose assignment intent in every PSA, flag states where the default flow is more restrictive, and include attorney-review language in every document. Retaining your own attorney is non-negotiable — on our side and yours.",
  },
];
