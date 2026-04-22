import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AppNav } from "./_components/app-nav";
import { UserMenu } from "./_components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bone flex flex-col">
      <a href="#app-main" className="skip-link">Skip to content</a>
      <header className="border-b border-rule bg-parchment/60 backdrop-blur-sm sticky top-0 z-30">
        <Container className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/app" aria-label="Wholesail home">
              <Logo className="h-7" />
            </Link>
            <AppNav />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/deals/new" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary">Start a deal</Button>
            </Link>
            <UserMenu />
          </div>
        </Container>
      </header>
      <main id="app-main" className="flex-1">{children}</main>
      <footer className="border-t border-rule py-6 text-xs text-ink-faint">
        <Container className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>
            Wholesail is not a law firm. Generated documents are starter templates — retain a licensed attorney to close.
          </span>
          <span className="text-ink-faint/80">© {new Date().getFullYear()} Wholesail</span>
        </Container>
      </footer>
    </div>
  );
}
