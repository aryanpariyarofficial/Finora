"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Gift, Lock, Users } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ReferralCard({
  code,
  referralCount,
  isPremium,
}: {
  code: string | null;
  referralCount: number;
  isPremium: boolean;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/signup?ref=${code}`
      : "";

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-5 text-[oklch(0.63_0.21_355)]" />
          {t.profile.referralTitle}
        </CardTitle>
        <CardDescription>{t.profile.referralSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium && code ? (
          <>
            <div className="flex max-w-md gap-2">
              <Input
                readOnly
                value={link || `/signup?ref=${code}`}
                className="font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={copy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-[var(--success)]" />
                    {t.profile.referralCopied}
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> {t.profile.referralCopy}
                  </>
                )}
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              {t.profile.referralCount}:{" "}
              <Badge variant="secondary">{referralCount}</Badge>
              {referralCount > 0 && (
                <span className="text-[var(--success)]">
                  +{referralCount * 30} pts
                </span>
              )}
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" /> {t.profile.referralLocked}
            </p>
            <Button size="sm" asChild>
              <Link href="/upgrade">{t.free.bannerCta}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
