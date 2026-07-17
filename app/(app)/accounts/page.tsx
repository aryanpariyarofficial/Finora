import { Banknote, Landmark, Wallet, CircleDollarSign } from "lucide-react";
import { AccountForm } from "@/components/accounts/account-form";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts } from "@/lib/data";
import { formatMoney } from "@/lib/finance";

export const metadata = { title: "Accounts" };

const subtypeIcon = {
  cash: Banknote,
  bank: Landmark,
  wallet: Wallet,
} as const;

export default async function AccountsPage() {
  const accounts = await getAccounts();
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
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Total balance: {formatMoney(total)}
          </p>
        </div>
        <AccountForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moneyAccounts.map((a) => {
          const Icon =
            subtypeIcon[a.subtype as keyof typeof subtypeIcon] ??
            CircleDollarSign;
          return (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {a.subtype ?? a.kind}
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(a.kind === "liability" ? -a.balance : a.balance)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
