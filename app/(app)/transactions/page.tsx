import { Suspense } from "react";
import { Lock } from "lucide-react";
import { FilterBar } from "@/components/transactions/filter-bar";
import { ExportMenu, type ExportRow } from "@/components/transactions/export-menu";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_TRANSACTION_LIMIT } from "@/lib/billing";
import { getAccounts, getTransactions } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { Money } from "@/components/money";
import { getDict } from "@/lib/i18n/server";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [t, ent, accounts] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
  ]);

  // Free tier ignores filters and only sees the latest few transactions.
  const all = await getTransactions(
    ent.isPremium
      ? {
          type: params.type,
          accountId: params.account,
          categoryId: params.category,
          from: params.from,
          to: params.to,
          q: params.q,
        }
      : {},
  );
  const transactions = ent.isPremium
    ? all
    : all.slice(0, FREE_TRANSACTION_LIMIT);

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const incomeCategories = accounts.filter((a) => a.kind === "income");
  const expenseCategories = accounts.filter((a) => a.kind === "expense");

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => acc + Number(tx.amount), 0);

  const exportRows: ExportRow[] = transactions.map((tx) => ({
    Date: tx.occurred_on,
    Type: tx.type,
    Category:
      tx.type === "transfer"
        ? `${tx.account?.name ?? ""} → ${tx.counter_account?.name ?? ""}`
        : (tx.category?.name ?? ""),
    Account: tx.account?.name ?? "",
    Amount: Number(tx.amount),
    Method: tx.payment_method
      ? PAYMENT_METHOD_LABELS[tx.payment_method]
      : "",
    Remarks: tx.description ?? "",
  }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.tx.title}</h1>
          <p className="text-sm text-muted-foreground">
            {transactions.length} {t.tx.shown} · {t.tx.in}{" "}
            <Money value={totalIncome} /> · {t.tx.out}{" "}
            <Money value={totalExpense} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ent.isPremium && <ExportMenu rows={exportRows} />}
          <TransactionForm
            accounts={moneyAccounts}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            allowTransfer={ent.isPremium}
          />
        </div>
      </div>

      {ent.isPremium ? (
        <Suspense>
          <FilterBar
            accounts={moneyAccounts}
            categories={[...expenseCategories, ...incomeCategories]}
          />
        </Suspense>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-3.5" /> {t.free.limitNote}
        </p>
      )}

      <Card>
        <CardContent>
          <TransactionList
            transactions={transactions}
            showDelete={ent.isPremium}
          />
        </CardContent>
      </Card>
    </>
  );
}
