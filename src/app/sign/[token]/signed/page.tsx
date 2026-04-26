import { Container, SectionLabel } from "@/components/ui/container";

export default function SignedPage() {
  return (
    <main className="min-h-screen bg-bone py-16 sm:py-24">
      <Container className="max-w-[680px]">
        <SectionLabel>Wholesail · Signed</SectionLabel>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mt-3 leading-[1.05] tracking-tight">
          Signature recorded.
        </h1>
        <p className="text-ink-soft mt-4 text-base leading-relaxed">
          Your signature has been delivered to the party that sent you this
          link. They will follow up with the next step in the transaction.
          You can safely close this window.
        </p>
        <div className="mt-10 rounded-[10px] border border-forest-200 bg-forest-50 p-5">
          <p className="text-sm text-forest-700 font-medium">
            What happens next
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm text-ink-soft">
            <li>• A copy of the signed document will be sent to your email if one was provided.</li>
            <li>• You may request a paper copy at any time from the sender.</li>
            <li>• An audit record of this signing event has been saved.</li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
