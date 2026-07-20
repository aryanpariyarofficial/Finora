import Link from "next/link";
import { CalendarClock, Landmark, Lock } from "lucide-react";
import { LoanForm } from "@/components/loans/loan-form";
import { LoanPaymentForm } from "@/components/loans/loan-payment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatAppDate } from "@/lib/calendar";
import { getAccounts, getLoans } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { Money } from "@/components/money";
import { getCalendar, getDict, getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Loans" };

function nextDueISO(startDate: string, paymentsCount: number) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setMonth(d.getMonth() + paymentsCount + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function LoansPage() {
  const [t, ent, accounts, loans, calendar, locale] = await Promise.all([
    getDict(),
    getEntitlements(),
    getAccounts(),
    getLoans(),
    getCalendar(),
    getLocale(),
  ]);

  const assetAccounts = accounts.filter((a) => a.kind === "asset");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.loans.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.loans.subtitle}</p>
        </div>
        {ent.isPremium ? (
          <LoanForm accounts={assetAccounts} />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.loans.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="rounded-2xl bg-muted p-4">
              <Landmark className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t.loans.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loans.map((loan) => {
            const paidPct = Math.min(
              100,
              Math.round((loan.principal_paid / loan.principal) * 100),
            );
            const closed = loan.status === "closed" || loan.outstanding <= 0;
            return (
              <Card key={loan.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>
                      {loan.lender}
                      {closed && (
                        <Badge variant="secondary" className="ml-2">
                          {t.loans.closed}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Money value={loan.principal} /> ·{" "}
                      {loan.annual_interest_rate}% · {loan.term_months}{" "}
                      {t.loans.month.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/loans/${loan.id}`}>
                        <CalendarClock className="size-4" />
                        {t.loans.viewSchedule}
                      </Link>
                    </Button>
                    {ent.isPremium && !closed && (
                      <LoanPaymentForm
                        loanId={loan.id}
                        lender={loan.lender}
                        defaultAmount={loan.emi_amount}
                        accounts={assetAccounts}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">
                        {t.loans.outstanding}
                      </p>
                      <p className="font-semibold tabular-nums">
                        <Money value={loan.outstanding} />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t.loans.emi}</p>
                      <p className="font-semibold tabular-nums">
                        {loan.emi_amount != null ? (
                          <Money value={loan.emi_amount} />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t.loans.interestPaid}
                      </p>
                      <p className="font-semibold tabular-nums">
                        <Money value={loan.interest_paid} />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t.loans.nextDue}
                      </p>
                      <p className="font-semibold">
                        {closed
                          ? "—"
                          : formatAppDate(
                              nextDueISO(loan.start_date, loan.payments_count),
                              calendar,
                              locale,
                            )}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Progress value={paidPct} />
                    <p className="text-xs text-muted-foreground">
                      {t.loans.principalPaid}: <Money value={loan.principal_paid} />{" "}
                      / <Money value={loan.principal} /> · {paidPct}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
