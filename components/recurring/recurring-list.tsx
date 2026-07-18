"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pause, Play, Repeat } from "lucide-react";
import { deleteRecurring, toggleRecurring } from "@/lib/actions/recurring";
import { useFormatDate, useT } from "@/components/locale-provider";
import { formatMoney } from "@/lib/finance";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecurringRow } from "@/lib/data";

export function RecurringList({ items }: { items: RecurringRow[] }) {
  const t = useT();
  const formatDate = useFormatDate();
  const [pending, startTransition] = useTransition();

  const freqLabel: Record<string, string> = {
    weekly: t.recur.weekly,
    monthly: t.recur.monthly,
    yearly: t.recur.yearly,
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="rounded-2xl bg-muted p-4">
            <Repeat className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t.recur.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((r) => {
        const title =
          r.type === "transfer"
            ? `${r.account?.name ?? "?"} → ${r.counter_account?.name ?? "?"}`
            : (r.category?.name ?? "?");
        return (
          <Card key={r.id} className={cn(!r.active && "opacity-60")}>
            <CardContent className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {title}
                  {r.description && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {r.description}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{freqLabel[r.frequency]}</Badge>
                  {t.recur.nextRun} {formatDate(r.next_run)}
                  {!r.active && (
                    <Badge variant="outline">{t.recur.inactive}</Badge>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  r.type === "income" && "text-[var(--success)]",
                  r.type === "expense" && "text-destructive",
                )}
              >
                {formatMoney(r.amount)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={r.active ? t.recur.paused : t.recur.resumed}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await toggleRecurring(r.id, !r.active);
                    if (res?.error) toast.error(res.error);
                    else toast.success(r.active ? t.recur.paused : t.recur.resumed);
                  })
                }
              >
                {r.active ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
              <ConfirmDelete
                action={() => deleteRecurring(r.id)}
                successMessage={t.recur.deleted}
                ariaLabel={t.recur.deleted}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
