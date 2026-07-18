import Link from "next/link";
import { Lock } from "lucide-react";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { Button } from "@/components/ui/button";
import { getAccounts } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { Money } from "@/components/money";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const [t, ent, accounts] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
  ]);
  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );
  const total = moneyAccounts.reduce(
    (acc, a) => acc + (a.kind === "liability" ? -a.balance : a.balance),
    0,
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.accounts.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.accounts.totalBalance}: <Money value={total} />
          </p>
        </div>
        {ent.isPremium ? (
          <AccountForm />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.accounts.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moneyAccounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>
    </>
  );
}
