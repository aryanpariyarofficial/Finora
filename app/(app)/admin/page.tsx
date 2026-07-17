import { redirect } from "next/navigation";
import { Infinity as InfinityIcon } from "lucide-react";
import { AdjustPoints } from "@/components/admin/adjust-points";
import { RequestActions } from "@/components/admin/request-actions";
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
  monthly: "Monthly (30 pts)",
  half_yearly: "6 Months (180 pts)",
  yearly: "1 Year (365 pts)",
  lifetime: "Lifetime",
};

export default async function AdminPage() {
  const ent = await getEntitlements();
  if (!ent.isSuperAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: requests }, { data: users }] = await Promise.all([
    supabase
      .from("payment_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, plan, points, lifetime, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Verify payments and manage user points. Approving automatically adds
          the plan&apos;s points (30 / 180 / 365 / lifetime).
        </p>
      </div>

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
                      {r.email} · {r.phone} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <RequestActions
                    requestId={r.id}
                    plan={r.plan}
                    screenshotPath={r.screenshot_path}
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
            Adjust points manually with +/− values (e.g. 30 to add a month,
            -5 to correct a mistake).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">
                      {u.full_name ?? "—"}
                      {u.role === "super_admin" && (
                        <Badge variant="outline" className="ml-2">
                          admin
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
