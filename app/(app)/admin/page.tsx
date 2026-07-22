import { redirect } from "next/navigation";
import {
  Infinity as InfinityIcon,
  Clock,
  Crown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdjustPoints } from "@/components/admin/adjust-points";
import { RequestActions } from "@/components/admin/request-actions";
import { UserActions } from "@/components/admin/user-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { PLANS } from "@/lib/billing";
import { formatMoney } from "@/lib/finance";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEntitlements } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

const PLAN_LABEL: Record<string, string> = {
  monthly: "Monthly (30 credits)",
  half_yearly: "6 Months (180 credits)",
  yearly: "1 Year (365 credits)",
  lifetime: "Lifetime",
};

/** Count profiles created within the last `days` days. */
function countRecentSignups(
  users: { created_at: string }[],
  days: number,
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return users.filter((u) => new Date(u.created_at).getTime() > cutoff).length;
}

export default async function AdminPage() {
  const ent = await getEntitlements();
  if (!ent.isSuperAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: requests }, { data: users }, { data: approved }] =
    await Promise.all([
      supabase
        .from("payment_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, plan, points, lifetime, role, created_at, deactivated_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("payment_requests")
        .select("plan")
        .eq("status", "approved"),
    ]);

  // ----- analytics -----
  const priceByPlan = Object.fromEntries(
    PLANS.map((p) => [p.id, p.price ?? 0]),
  ) as Record<string, number>;
  const revenue = (approved ?? []).reduce(
    (acc, r) => acc + (priceByPlan[r.plan] ?? 0),
    0,
  );

  // Deactivated accounts (test logins, abandoned signups) are kept in the
  // table but left out of the numbers so they don't skew the analytics.
  const allUsers = (users ?? []).filter((u) => !u.deactivated_at);
  const totalUsers = allUsers.length;
  const premiumUsers = allUsers.filter(
    (u) => u.lifetime || u.points > 0,
  ).length;
  const conversion =
    totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

  const newUsers = countRecentSignups(allUsers, 30);

  const planCounts: Record<string, number> = {
    free: 0,
    monthly: 0,
    half_yearly: 0,
    yearly: 0,
    lifetime: 0,
  };
  for (const u of allUsers) {
    const key = u.lifetime ? "lifetime" : u.points > 0 ? u.plan : "free";
    planCounts[key] = (planCounts[key] ?? 0) + 1;
  }

  const PLAN_NAMES: Record<string, string> = {
    free: "Free",
    monthly: "Monthly",
    half_yearly: "6 Months",
    yearly: "1 Year",
    lifetime: "Lifetime",
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Verify payments and manage user credits. Approving automatically adds
          the plan&apos;s credits (30 / 180 / 365 / lifetime).
        </p>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total revenue"
          value={formatMoney(revenue)}
          hint={`${approved?.length ?? 0} payments`}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          title="Total users"
          value={String(totalUsers)}
          hint={`+${newUsers} in 30 days`}
          icon={Users}
        />
        <StatCard
          title="Premium users"
          value={String(premiumUsers)}
          hint={`${conversion}% conversion`}
          icon={Crown}
          tone="positive"
        />
        <StatCard
          title="Pending requests"
          value={String(requests?.length ?? 0)}
          hint={`+${newUsers} new signups`}
          icon={Clock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(planCounts).map(([plan, count]) => (
              <div key={plan} className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {PLAN_NAMES[plan]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Pending payment requests
            {requests && requests.length > 0 && (
              <Badge className="ml-2">{requests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Check the proof screenshot against your eSewa/Khalti statement
            before approving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending requests. 🎉
            </p>
          ) : (
            <ul className="divide-y">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.full_name}
                      <Badge variant="secondary" className="ml-2">
                        {PLAN_LABEL[r.plan] ?? r.plan}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.email} · {r.phone}
                      {r.pay_method
                        ? ` · via ${String(r.pay_method).replace(/_/g, " ")}`
                        : ""}{" "}
                      · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <RequestActions
                    requestId={r.id}
                    plan={r.plan}
                    screenshotPath={r.screenshot_path}
                    requesterName={r.full_name}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Adjust credits manually with +/− values (e.g. 30 to add a month,
            -5 to correct a mistake). Deactivating blocks sign-in and stops all
            reminder emails; deleting removes the account and all its data
            permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Adjust</TableHead>
                <TableHead className="text-right">Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id} className={u.deactivated_at ? "opacity-60" : ""}>
                  <TableCell>
                    <p className="font-medium">
                      {u.full_name ?? "—"}
                      {u.role === "super_admin" && (
                        <Badge variant="outline" className="ml-2">
                          admin
                        </Badge>
                      )}
                      {u.deactivated_at && (
                        <Badge variant="secondary" className="ml-2">
                          deactivated
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.email ?? ""}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="capitalize">
                    {u.plan?.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {u.lifetime ? (
                      <InfinityIcon className="size-4" />
                    ) : (
                      <span className="tabular-nums">{u.points}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!u.lifetime && <AdjustPoints userId={u.id} />}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role === "super_admin" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <UserActions
                        userId={u.id}
                        name={u.full_name ?? u.email ?? "this user"}
                        deactivated={u.deactivated_at != null}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
