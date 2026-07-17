import { redirect } from "next/navigation";
import { Check, Infinity as InfinityIcon } from "lucide-react";
import { PaymentRequestForm } from "@/components/upgrade/payment-request-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/billing";
import { getEntitlements } from "@/lib/entitlements";
import { formatMoney } from "@/lib/finance";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Upgrade" };

const PLAN_FEATURES = [
  "Unlimited transaction history",
  "Edit, delete & transfers",
  "Unlimited accounts",
  "Budgets, loans & investments",
  "Reports + Excel/PDF export",
];

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, ent, { data: profile }, { data: requests }] = await Promise.all([
    getDict(),
    getEntitlements(),
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("payment_requests")
      .select("id, plan, status, points_awarded, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const planLabel: Record<string, string> = {
    monthly: t.upgrade.monthly,
    half_yearly: t.upgrade.half_yearly,
    yearly: t.upgrade.yearly,
    lifetime: t.upgrade.lifetimePlan,
    free: t.upgrade.free,
  };
  const statusLabel: Record<string, string> = {
    pending: t.upgrade.statusPending,
    approved: t.upgrade.statusApproved,
    rejected: t.upgrade.statusRejected,
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.upgrade.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t.upgrade.subtitle}
        </p>
        <p className="mt-2 text-sm">
          {t.upgrade.currentPlan}:{" "}
          <Badge variant="secondary">{planLabel[ent.plan] ?? ent.plan}</Badge>{" "}
          {ent.lifetime ? (
            <span className="text-muted-foreground">{t.upgrade.lifetime}</span>
          ) : (
            <span className="text-muted-foreground">
              {ent.points} {t.upgrade.daysLeft}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.popular ? "border-[oklch(0.63_0.21_355)] shadow-md" : ""
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{planLabel[plan.id]}</CardTitle>
                {plan.popular && (
                  <Badge className="bg-[oklch(0.63_0.21_355)] text-white">
                    {t.upgrade.popular}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">
                {plan.price != null ? (
                  formatMoney(plan.price)
                ) : (
                  <span className="text-base font-medium text-muted-foreground">
                    {t.upgrade.pricePending}
                  </span>
                )}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {plan.points != null ? (
                  <>
                    {plan.points} {t.upgrade.points} · {plan.days}{" "}
                    {t.upgrade.daysLeft}
                  </>
                ) : (
                  <>
                    <InfinityIcon className="size-4" /> {t.upgrade.unlimited}
                  </>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentRequestForm
        defaultName={profile?.full_name ?? ""}
        defaultEmail={user.email ?? ""}
        defaultPhone={profile?.phone ?? ""}
      />

      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.upgrade.myRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span>
                    {planLabel[r.plan] ?? r.plan}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "default"
                        : r.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {statusLabel[r.status] ?? r.status}
                    {r.status === "approved" && r.points_awarded
                      ? ` · +${r.points_awarded}`
                      : ""}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
