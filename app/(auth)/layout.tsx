import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <Link href="/">
        <Logo />
      </Link>
      {children}
    </main>
  );
}
