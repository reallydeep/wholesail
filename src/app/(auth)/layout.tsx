import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="cinematic"
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(900px 600px at 20% 10%, rgba(56,120,160,0.22), transparent 60%), radial-gradient(800px 500px at 85% 90%, rgba(20,60,90,0.28), transparent 60%), hsl(201 100% 11%)",
        }}
      />

      <header className="relative z-10 max-w-7xl w-full mx-auto px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl tracking-tight text-white leading-none"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Wholesail<sup className="text-xs">®</sup>
        </Link>
        <Link
          href="/overview"
          className="text-xs text-white/60 hover:text-white transition-colors uppercase tracking-[0.18em]"
        >
          Full overview
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        {children}
      </main>

      <footer className="relative z-10 py-6 text-center text-[11px] text-white/40">
        © 2026 Wholesail. Not a law firm. Not legal advice.
      </footer>
    </div>
  );
}
