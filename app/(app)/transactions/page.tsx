import { Suspense } from "react";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts, getTransactions } from "@/lib/data";
import { formatMoney } from "@/lib/finance";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions({
      type: params.type,
      accountId: params.account,
      categoryId: params.category,
      from: params.from,
      to: params.to,
      q: params.q,
    }),
  ]);

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const incomeCategories = accounts.filter((a) => a.kind === "income");
  const expenseCategories = accounts.filter((a) => a.kind === "expense");

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {transactions.length} shown · In {formatMoney(totalIncome)} · Out{" "}
            {formatMoney(totalExpense)}
          </p>
        </div>
        <TransactionForm
          accounts={moneyAccounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
        />
      </div>

      <Suspense>
        <FilterBar
          accounts={moneyAccounts}
          categories={[...expenseCategories, ...incomeCategories]}
        />
      </Suspense>

      <Card>
        <CardContent>
          <TransactionList transactions={transactions} showDelete />
        </CardContent>
      </Card>
    </>
  );
}
