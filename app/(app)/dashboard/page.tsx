import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAccounts,
  getCashflowByMonth,
  getCategoryTotals,
  getMonthlySummary,
  getRecentTransactions,
} from "@/lib/data";
import { formatMoney, monthStart } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [accounts, summary, recent, categoryTotals, cashflow] =
    await Promise.all([
      getAccounts(),
      getMonthlySummary(),
      getRecentTransactions(8),
      getCategoryTotals("expense", monthStart()),
      getCashflowByMonth(6),
    ]);

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const incomeCategories = accounts.filter((a) => a.kind === "income");
  const expenseCategories = accounts.filter((a) => a.kind === "expense");

  const currentBalance = moneyAccounts.reduce(
    (acc, a) => acc + (a.kind === "liability" ? -a.balance : a.balance),
    0,
  );
  const net = summary.income - summary.expense;
  const savingsRate =
    summary.income > 0 ? Math.round((net / summary.income) * 100) : 0;

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your money at a glance.
          </p>
        </div>
        <TransactionForm
          accounts={moneyAccounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Current balance"
          value={formatMoney(currentBalance)}
          hint={`${moneyAccounts.length} accounts`}
          icon={Wallet}
        />
        <StatCard
          title="Monthly income"
          value={formatMoney(summary.income)}
          hint={`Today: ${formatMoney(summary.todayIncome)}`}
          icon={ArrowDownLeft}
          tone="positive"
        />
        <StatCard
          title="Monthly expense"
          value={formatMoney(summary.expense)}
          hint={`Today: ${formatMoney(summary.todayExpense)}`}
          icon={ArrowUpRight}
          tone="negative"
        />
        <StatCard
          title="Net this month"
          value={formatMoney(net, { signed: true })}
          hint={
            summary.income > 0 ? `Savings rate ${savingsRate}%` : undefined
          }
          icon={PiggyBank}
          tone={net >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CashflowChart data={cashflow} />
        <CategoryDonut data={categoryTotals} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recent} />
        </CardContent>
      </Card>
    </>
  );
}
