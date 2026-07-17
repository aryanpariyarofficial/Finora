import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PlansSection } from "@/components/upgrade/plans";
import { WhatsAppFab } from "@/components/upgrade/whatsapp-fab";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntitlements } from "@/lib/entitlements";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Upgrade" };

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
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t.upgrade.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.upgrade.subtitle}
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-[var(--success)]" />
          <span className="text-muted-foreground">{t.upgrade.valueBlurb}</span>
        </p>
        <p className="mt-3 text-sm">
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

      <PlansSection
        currentPlan={ent.plan}
        isPremium={ent.isPremium}
        defaults={{
          name: profile?.full_name ?? "",
          email: user.email ?? "",
          phone: profile?.phone ?? "",
        }}
      />

      <WhatsAppFab
        name={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
        email={user.email ?? ""}
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
