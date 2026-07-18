"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { useFormatDate, useT } from "@/components/locale-provider";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Money } from "@/components/money";
import { PAYMENT_METHOD_LABELS, type TransactionWithNames } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
  const t = useT();
  const formatDate = useFormatDate();

  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {t.tx.empty}
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {transactions.map((tx) => {
        const title =
          tx.type === "transfer"
            ? `${tx.account?.name ?? "?"} → ${tx.counter_account?.name ?? "?"}`
            : (tx.category?.name ?? "Uncategorized");
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <TypeIcon type={tx.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {title}
                {tx.description && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    {tx.description}
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {formatDate(tx.occurred_on)}
                {tx.type !== "transfer" && tx.account?.name && (
                  <span>· {tx.account.name}</span>
                )}
                {tx.payment_method && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {PAYMENT_METHOD_LABELS[tx.payment_method]}
                  </Badge>
                )}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                tx.type === "income" && "text-[var(--success)]",
                tx.type === "expense" && "text-destructive",
              )}
            >
              <Money
                value={tx.type === "expense" ? -tx.amount : tx.amount}
                signed={tx.type === "income"}
              />
            </span>
            {showDelete && (
              <ConfirmDelete
                action={() => deleteTransaction(tx.id)}
                successMessage={t.tx.deleted}
                ariaLabel="Delete transaction"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
