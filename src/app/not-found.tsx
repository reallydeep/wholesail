import Link from "next/link";
import { Container, SectionLabel } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-bone flex flex-col">
      <header className="border-b border-rule/60">
        <Container className="h-16 flex items-center">
          <Link href="/" aria-label="Wholesail home">
            <Logo className="h-7" />
          </Link>
        </Container>
      </header>
      <main className="flex-1 flex items-center">
        <Container className="max-w-3xl">
          <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-start">
            <div className="relative">
              <div className="font-display italic text-[160px] md:text-[220px] leading-none tracking-[-0.04em] text-brass-500/30 select-none">
                404
              </div>
              <div
                aria-hidden
                className="absolute -right-2 top-6 rotate-[-4deg] border border-clay-600/60 text-clay-600 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-mono bg-bone"
              >
                Not on the desk
              </div>
            </div>

            <div className="pt-4 md:pt-10">
              <SectionLabel>Page missing</SectionLabel>
              <h1 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05] tracking-tight text-ink">
                That address doesn&rsquo;t match any deal we&rsquo;ve filed.
              </h1>
              <p className="text-ink-soft mt-5 max-w-md leading-relaxed">
                The link may be stale, or the deal was removed from the
                ledger. Head back to the pipeline and start a fresh one.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app">
                  <Button variant="primary" size="lg">
                    Back to pipeline
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="lg">
                    Landing page
                  </Button>
                </Link>
              </div>

              <div className="mt-12 pt-6 border-t border-rule text-[11px] uppercase tracking-[0.16em] text-ink-faint font-mono">
                Error · 404 · Ledger
              </div>
            </div>
          </div>
        </Container>
      </main>
      <footer className="border-t border-rule py-6 text-xs text-ink-faint">
        <Container>Wholesail is not a law firm. Not legal advice.</Container>
      </footer>
    </div>
  );
}
