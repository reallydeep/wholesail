import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AppNav } from "./_components/app-nav";
import { UserMenu } from "./_components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { DealMigrationRunner } from "./_components/deal-migration-runner";
import { useSupabase } from "@/lib/env";
import { getServerSession } from "@/lib/auth/supabase-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let firmName: string | null = null;
  if (useSupabase) {
    try {
      const session = await getServerSession();
      firmName = session?.firm.name ?? null;
    } catch {
      firmName = null;
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bone flex flex-col">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-rule bg-parchment/60 backdrop-blur-sm sticky top-0 z-30">
        <Container className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/app" aria-label="Wholesail home">
              <Logo className="h-7" />
            </Link>
            {firmName && (
              <span className="hidden md:inline-block text-[11px] uppercase tracking-[0.18em] text-ink-faint border-l border-rule pl-4">
                {firmName}
              </span>
            )}
            <AppNav />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/deals/new" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary">
                Start a deal
              </Button>
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </Container>
      </header>
      <main id="app-main" className="flex-1">
        {useSupabase && <DealMigrationRunner />}
        {children}
      </main>
      <footer className="border-t border-rule py-6 text-xs text-ink-faint">
        <Container className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>
            Wholesail is not a law firm. Generated documents are starter
            templates — retain a licensed attorney to close.
          </span>
          <span className="text-ink-faint/80">
            © {new Date().getFullYear()} Wholesail
          </span>
        </Container>
      </footer>
    </div>
  );
}
