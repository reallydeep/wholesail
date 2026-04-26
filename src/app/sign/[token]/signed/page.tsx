import { Container } from "@/components/ui/container";
import { SignedReveal } from "./_components/signed-reveal";

export default function SignedPage() {
  return (
    <main className="min-h-screen bg-bone py-16 sm:py-24">
      <Container className="max-w-[680px]">
        <SignedReveal />
      </Container>
    </main>
  );
}
