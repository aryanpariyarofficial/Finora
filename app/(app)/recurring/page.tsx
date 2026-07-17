import Link from "next/link";
import { Lock } from "lucide-react";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringList } from "@/components/recurring/recurring-list";
import { Button } from "@/components/ui/button";
import { getAccounts, getRecurring, runDueRecurring } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Recurring" };

export default async function RecurringPage() {
  // Back-fill any due recurring transactions before showing the list.
  await runDueRecurring();

  const [t, ent, accounts, items] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
    getRecurring(),
  ]);

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const incomeCategories = accounts.filter((a) => a.kind === "income");
  const expenseCategories = accounts.filter((a) => a.kind === "expense");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.recur.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.recur.subtitle}</p>
        </div>
        {ent.isPremium ? (
          <RecurringForm
            accounts={moneyAccounts}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
          />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.recur.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      <RecurringList items={items} />
    </>
  );
}
