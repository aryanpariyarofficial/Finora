import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <article className="prose-finora space-y-4">{children}</article>
      </main>
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span>· Finora by UDAN Technology</span>
        </div>
      </footer>
    </div>
  );
}
