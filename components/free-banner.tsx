"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function FreeBanner() {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[oklch(0.63_0.21_355)]/30 bg-[oklch(0.63_0.21_355)]/5 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2">
        <Sparkles className="size-4 text-[oklch(0.63_0.21_355)]" />
        {t.free.banner}
      </span>
      <Button size="sm" asChild>
        <Link href="/upgrade">{t.free.bannerCta}</Link>
      </Button>
    </div>
  );
}
