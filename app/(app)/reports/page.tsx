import { Suspense } from "react";
import { ArrowDownLeft, ArrowUpRight, Hash, Lock, PiggyBank } from "lucide-react";
import {
  CashflowChart,
  CategoryDonut,
  NetWorthChart,
  SavingsTrend,
} from "@/components/dashboard/lazy-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { PeriodPicker } from "@/components/reports/period-picker";
import { ReportExport } from "@/components/reports/report-export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNetWorthTimeline, getReportData, type CategoryTotal } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { formatMoney, monthStart, todayISO } from "@/lib/finance";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Reports" };

function resolveRange(period: string): { from: string; to: string } {
  const now = new Date();
  const to = todayISO();

  switch (period) {
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { from: fmt(start), to: fmt(end) };
    }
    case "3m":
    case "6m":
    case "12m": {
      const months = parseInt(period, 10);
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      return {
        from: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
        to,
      };
    }
    default:
      return { from: monthStart(), to };
  }
}

function CategoryTable({
  title,
  rows,
  total,
  emptyLabel,
}: {
  title: string;
  rows: CategoryTotal[];
  total: number;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((row) => (
              <li
                key={row.category}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span>{row.category}</span>
                <span className="font-medium tabular-nums">
                  {formatMoney(row.total)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {total > 0 ? Math.round((row.total / total) * 100) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [t, ent] = await Promise.all([getDict(), getEntitlements()]);

  // Free plan is locked to the current month.
  const period = ent.isPremium ? (params.period ?? "this_month") : "this_month";
  const { from, to } = resolveRange(period);
  const report = await getReportData(from, to);

  const periodLabel = `${from} → ${to}`;
  const net = report.income - report.expense;
  const netWorth = ent.isPremium ? await getNetWorthTimeline(12) : [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.reports.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {ent.isPremium ? (
            <>
              <Suspense>
                <PeriodPicker />
              </Suspense>
              <ReportExport
                periodLabel={periodLabel}
                income={report.income}
                expense={report.expense}
                incomeByCategory={report.incomeByCategory}
                expenseByCategory={report.expenseByCategory}
              />
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-3.5" /> {t.reports.premiumNote}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.reports.income}
          value={formatMoney(report.income)}
          icon={ArrowDownLeft}
          tone="positive"
        />
        <StatCard
          title={t.reports.expense}
          value={formatMoney(report.expense)}
          icon={ArrowUpRight}
          tone="negative"
        />
        <StatCard
          title={t.reports.net}
          value={formatMoney(net, { signed: true })}
          icon={PiggyBank}
          tone={net >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title={t.reports.txCount}
          value={String(report.txCount)}
          icon={Hash}
        />
      </div>

      {netWorth.length > 1 && <NetWorthChart data={netWorth} />}

      {report.monthly.length > 1 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CashflowChart
            data={report.monthly}
            title={t.reports.trend}
            description={periodLabel}
          />
          <SavingsTrend data={report.monthly} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CategoryDonut
          data={report.expenseByCategory}
          title={t.reports.expenseByCategory}
          subtitle={periodLabel}
          emptyLabel={t.reports.noData}
        />
        <CategoryDonut
          data={report.incomeByCategory}
          title={t.reports.incomeByCategory}
          subtitle={periodLabel}
          emptyLabel={t.reports.noData}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CategoryTable
          title={t.reports.expenseByCategory}
          rows={report.expenseByCategory}
          total={report.expense}
          emptyLabel={t.reports.noData}
        />
        <CategoryTable
          title={t.reports.incomeByCategory}
          rows={report.incomeByCategory}
          total={report.income}
          emptyLabel={t.reports.noData}
        />
      </div>
    </>
  );
}
