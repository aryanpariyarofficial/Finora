import Link from "next/link";
import { Lock, TriangleAlert } from "lucide-react";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetList } from "@/components/budgets/budget-list";
import { Button } from "@/components/ui/button";
import { getAccounts, getBudgetsWithSpend } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { monthStart } from "@/lib/finance";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const month = monthStart();
  const [t, ent, accounts, budgets] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
    getBudgetsWithSpend(month),
  ]);

  const expenseCategories = accounts.filter((a) => a.kind === "expense");
  const monthLabel = new Date(`${month}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Budgets at 90%+ of their limit — surfaced as an alert banner.
  const atRisk = budgets.filter((b) => b.spent / b.amount >= 0.9);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.budgets.title}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {monthLabel}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t.budgets.subtitle}</p>
        </div>
        {ent.isPremium ? (
          <BudgetForm categories={expenseCategories} month={month} />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.budgets.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      {atRisk.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-[var(--warning)]" />
          <span>{t.budgets.alertBanner}</span>
          <span className="font-medium">
            {atRisk.map((b) => b.category_name).join(", ")}
          </span>
        </div>
      )}

      <BudgetList budgets={budgets} canEdit={ent.isPremium} />
    </>
  );
}
