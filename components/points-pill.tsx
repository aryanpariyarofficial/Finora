"use client";

import Link from "next/link";
import { Infinity as InfinityIcon, Zap } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function PointsPill({
  points,
  lifetime,
}: {
  points: number;
  lifetime: boolean;
}) {
  const t = useT();
  const low = !lifetime && points <= 5;

  return (
    <Link
      href="/upgrade"
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent",
        low && points > 0 && "border-[var(--warning)] text-[var(--warning)]",
        !lifetime && points === 0 && "border-destructive text-destructive",
      )}
    >
      {lifetime ? (
        <>
          <InfinityIcon className="size-3.5" />
          {t.upgrade.lifetimePlan}
        </>
      ) : (
        <>
          <Zap className="size-3.5" />
          {points} {t.upgrade.daysLeft}
        </>
      )}
    </Link>
  );
}
