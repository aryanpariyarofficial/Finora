"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function ErrorView({ reset }: { reset?: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-2xl bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t.errors.title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t.errors.body}</p>
      </div>
      <div className="flex gap-2">
        {reset && <Button onClick={reset}>{t.errors.retry}</Button>}
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t.errors.home}</Link>
        </Button>
      </div>
    </div>
  );
}
