"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { formatDate, formatMoney } from "@/lib/finance";
import { PAYMENT_METHOD_LABELS, type TransactionWithNames } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function TypeIcon({ type }: { type: string }) {
  if (type === "income")
    return (
      <span className="rounded-full bg-[var(--success)]/12 p-2">
        <ArrowDownLeft className="size-4 text-[var(--success)]" />
      </span>
    );
  if (type === "expense")
    return (
      <span className="rounded-full bg-destructive/10 p-2">
        <ArrowUpRight className="size-4 text-destructive" />
      </span>
    );
  return (
    <span className="rounded-full bg-muted p-2">
      <ArrowLeftRight className="size-4 text-muted-foreground" />
    </span>
  );
}

export function TransactionList({
  transactions,
  showDelete = false,
}: {
  transactions: TransactionWithNames[];
  showDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No transactions yet. Add your first one to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {transactions.map((t) => {
        const title =
          t.type === "transfer"
            ? `${t.account?.name ?? "?"} → ${t.counter_account?.name ?? "?"}`
            : (t.category?.name ?? "Uncategorized");
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <TypeIcon type={t.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {title}
                {t.description && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    {t.description}
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {formatDate(t.occurred_on)}
                {t.type !== "transfer" && t.account?.name && (
                  <span>· {t.account.name}</span>
                )}
                {t.payment_method && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {PAYMENT_METHOD_LABELS[t.payment_method]}
                  </Badge>
                )}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                t.type === "income" && "text-[var(--success)]",
                t.type === "expense" && "text-destructive",
              )}
            >
              {formatMoney(
                t.type === "expense" ? -t.amount : t.amount,
                { signed: t.type === "income" },
              )}
            </span>
            {showDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete transaction"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteTransaction(t.id);
                    if (res?.error) toast.error(res.error);
                    else toast.success("Transaction deleted");
                  })
                }
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
