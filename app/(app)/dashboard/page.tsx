import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { CashflowChart, CategoryDonut } from "@/components/dashboard/lazy-charts";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
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
  getInvestments,
  getMonthlySummary,
  getRecentTransactions,
  runDueRecurring,
} from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { monthStart } from "@/lib/finance";
import { Money, MoneyEye } from "@/components/money";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Materialize any due recurring transactions before computing totals.
  await runDueRecurring();

  const [
    t,
    ent,
    accounts,
    summary,
    recent,
    categoryTotals,
    cashflow,
    investments,
  ] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
    getMonthlySummary(),
    getRecentTransactions(8),
    getCategoryTotals("expense", monthStart()),
    getCashflowByMonth(6),
    getInvestments(),
  ]);

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const incomeCategories = accounts.filter((a) => a.kind === "income");
  const expenseCategories = accounts.filter((a) => a.kind === "expense");

  const { data: onboardRow } = await supabase
    .from("profiles")
    .select("onboarded_at, locale, calendar")
    .eq("id", user?.id ?? "")
    .single();
  const needsOnboarding = onboardRow != null && onboardRow.onboarded_at == null;

  const currentBalance = moneyAccounts.reduce(
    (acc, a) => acc + (a.kind === "liability" ? -a.balance : a.balance),
    0,
  );
  const net = summary.income - summary.expense;
  const savingsRate =
    summary.income > 0 ? Math.round((net / summary.income) * 100) : 0;

  const totalLoanOutstanding = accounts
    .filter((a) => a.kind === "liability")
    .reduce((acc, a) => acc + a.balance, 0);
  const investmentValue = investments.reduce(
    (acc, i) => acc + i.current_value,
    0,
  );

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <>
      {needsOnboarding && (
        <OnboardingDialog
          accounts={moneyAccounts}
          expenseCategories={expenseCategories}
          initialLocale={onboardRow?.locale ?? "en"}
          initialCalendar={onboardRow?.calendar ?? "ad"}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.dash.welcome}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">{t.dash.subtitle}</p>
        </div>
        <TransactionForm
          accounts={moneyAccounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          allowTransfer={ent.isPremium}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.dash.currentBalance}
          value={
            <span className="inline-flex items-center gap-2">
              <Money value={currentBalance} />
              <MoneyEye />
            </span>
          }
          hint={`${moneyAccounts.length} ${t.dash.accounts}`}
          icon={Wallet}
        />
        <StatCard
          title={t.dash.monthlyIncome}
          value={<Money value={summary.income} />}
          hint={
            <>
              {t.dash.today}: <Money value={summary.todayIncome} />
            </>
          }
          icon={ArrowDownLeft}
          tone="positive"
        />
        <StatCard
          title={t.dash.monthlyExpense}
          value={<Money value={summary.expense} />}
          hint={
            <>
              {t.dash.today}: <Money value={summary.todayExpense} />
            </>
          }
          icon={ArrowUpRight}
          tone="negative"
        />
        <StatCard
          title={t.dash.netThisMonth}
          value={<Money value={net} signed />}
          hint={
            summary.income > 0
              ? `${t.dash.savingsRate} ${savingsRate}%`
              : undefined
          }
          icon={PiggyBank}
          tone={net >= 0 ? "positive" : "negative"}
        />
      </div>

      {(totalLoanOutstanding > 0 || investmentValue > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title={t.invest.totalValue}
            value={<Money value={investmentValue} />}
            icon={TrendingUp}
          />
          <StatCard
            title={t.loans.outstanding}
            value={<Money value={totalLoanOutstanding} />}
            icon={Landmark}
            tone={totalLoanOutstanding > 0 ? "negative" : "default"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CashflowChart data={cashflow} />
        <CategoryDonut data={categoryTotals} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.dash.recentTransactions}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">{t.dash.viewAll}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recent} />
        </CardContent>
      </Card>
    </>
  );
}
