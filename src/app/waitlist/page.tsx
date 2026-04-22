import Link from "next/link";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const sp = await searchParams;
  const states = (sp.state ?? "").split(",").filter(Boolean);
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="liquid-glass rounded-[18px] p-8 sm:p-10 bg-white/[0.03]">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-4">
            Waitlist
          </div>
          <h1
            className="text-4xl sm:text-5xl text-white leading-[1.02]"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-1px" }}
          >
            You&rsquo;re on the list.
          </h1>
          <p className="text-sm text-white/60 mt-5 leading-relaxed">
            Wholesail currently operates in 14 states where wholesaling is
            unambiguously legal. We captured your interest in{" "}
            <strong className="text-white/85 font-medium">
              {states.length > 0 ? states.join(", ") : "unsupported states"}
            </strong>{" "}
            and will email you the moment coverage expands there.
          </p>
          <p className="text-xs text-white/45 mt-5 leading-relaxed">
            Already hold a broker license in those states?{" "}
            <a
              href="mailto:team@wholesail.app"
              className="underline underline-offset-2 text-white/70 hover:text-white"
            >
              Email us
            </a>{" "}
            — we can onboard your firm under a manual compliance attestation.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
            >
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
