import Link from "next/link";
import { Lock, TrendingUp, Wallet2 } from "lucide-react";
import { InvestmentCard } from "@/components/investments/investment-card";
import { InvestmentForm } from "@/components/investments/investment-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInvestments } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { Money } from "@/components/money";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const [t, ent, investments] = await Promise.all([
    getDict(),
    getEntitlements(),
    getInvestments(),
  ]);

  const totalInvested = investments.reduce(
    (acc, i) => acc + i.invested_amount,
    0,
  );
  const totalValue = investments.reduce((acc, i) => acc + i.current_value, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.invest.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.invest.subtitle}</p>
        </div>
        {ent.isPremium ? (
          <InvestmentForm />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.invest.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title={t.invest.totalInvested}
            value={<Money value={totalInvested} />}
            icon={Wallet2}
          />
          <StatCard
            title={t.invest.totalValue}
            value={<Money value={totalValue} />}
            hint={<Money value={totalValue - totalInvested} signed />}
            icon={TrendingUp}
            tone={totalValue >= totalInvested ? "positive" : "negative"}
          />
        </div>
      )}

      {investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="rounded-2xl bg-muted p-4">
              <TrendingUp className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t.invest.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {investments.map((inv) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              canEdit={ent.isPremium}
            />
          ))}
        </div>
      )}
    </>
  );
}
