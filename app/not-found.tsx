import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDict();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-6xl font-bold tracking-tight text-muted-foreground">
          404
        </p>
        <h1 className="text-lg font-semibold">{t.errors.notFoundTitle}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t.errors.notFoundBody}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">{t.errors.home}</Link>
      </Button>
    </main>
  );
}
