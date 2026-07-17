"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteBudget } from "@/lib/actions/budgets";
import { formatMoney } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BudgetWithSpend } from "@/lib/data";

export function BudgetList({
  budgets,
  canEdit,
}: {
  budgets: BudgetWithSpend[];
  canEdit: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t.budgets.empty}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {budgets.map((b) => {
        const pct = Math.min(100, Math.round((b.spent / b.amount) * 100));
        const over = b.spent > b.amount;
        return (
          <Card key={b.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {b.category_name}
                  {over && (
                    <Badge variant="destructive" className="ml-2">
                      {t.budgets.overBudget}
                    </Badge>
                  )}
                </p>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete budget"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deleteBudget(b.id);
                        if (res?.error) toast.error(res.error);
                        else toast.success(t.budgets.deleted);
                      })
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Progress
                value={pct}
                className={cn(over && "[&>[data-slot=progress-indicator]]:bg-destructive")}
              />
              <p className="text-sm text-muted-foreground">
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    over ? "text-destructive" : "text-foreground",
                  )}
                >
                  {formatMoney(b.spent)}
                </span>{" "}
                / {formatMoney(b.amount)} · {pct}%
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
