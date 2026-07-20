import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ScheduleTable } from "@/components/loans/schedule-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLoan } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { todayISO } from "@/lib/finance";
import { getDict } from "@/lib/i18n/server";
import { buildLoanSchedule } from "@/lib/schedule";
import { Landmark, Percent, Wallet } from "lucide-react";

export const metadata = { title: "Loan schedule" };

export default async function LoanSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, ent, loan] = await Promise.all([
    getDict(),
    getEntitlements(),
    getLoan(id),
  ]);

  if (!loan) notFound();
  if (!ent.isPremium) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">{t.free.limitNote}</p>
        <Button className="mt-4" asChild>
          <Link href="/upgrade">{t.free.bannerCta}</Link>
        </Button>
      </div>
    );
  }

  const rows = buildLoanSchedule({
    principal: loan.principal,
    annualRatePct: loan.annual_interest_rate,
    termMonths: loan.term_months,
    startDate: loan.start_date,
    emiAmount: loan.emi_amount,
    paymentsMade: loan.payments_count,
    todayISO: todayISO(),
  });

  const totalInterest = rows.reduce((acc, r) => acc + r.interest, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-1 -ml-2" asChild>
            <Link href="/loans">
              <ArrowLeft className="size-4" /> {t.loans.back}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {loan.lender}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {t.loans.scheduleTitle}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            <Money value={loan.principal} /> · {loan.annual_interest_rate}% ·{" "}
            {loan.term_months} {t.loans.month.toLowerCase()}
            {loan.status === "closed" && (
              <Badge variant="secondary" className="ml-2">
                {t.loans.closed}
              </Badge>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={t.loans.outstanding}
          value={<Money value={loan.outstanding} />}
          icon={Landmark}
          tone={loan.outstanding > 0 ? "negative" : "default"}
        />
        <StatCard
          title={t.loans.emi}
          value={loan.emi_amount != null ? <Money value={loan.emi_amount} /> : "—"}
          icon={Wallet}
        />
        <StatCard
          title={t.loans.interestPaid}
          value={<Money value={loan.interest_paid} />}
          icon={Percent}
        />
        <StatCard
          title={t.loans.interest}
          value={<Money value={totalInterest} />}
          hint={`${rows.length} ${t.loans.month.toLowerCase()}`}
          icon={Percent}
        />
      </div>

      <ScheduleTable rows={rows} lender={loan.lender} />
    </>
  );
}
