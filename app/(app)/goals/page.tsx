import Link from "next/link";
import { Lock, Target } from "lucide-react";
import { GoalCard, type Goal } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEntitlements } from "@/lib/entitlements";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const [t, ent, { data: goals }] = await Promise.all([
    getDict(),
    getEntitlements(),
    supabase
      .from("savings_goals")
      .select("id, name, target_amount, saved_amount, target_date, achieved_at")
      .order("created_at", { ascending: false }),
  ]);

  const items = (goals ?? []).map((g) => ({
    ...g,
    target_amount: Number(g.target_amount),
    saved_amount: Number(g.saved_amount),
  })) as Goal[];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.goals.title}</h1>
          <p className="text-sm text-muted-foreground">{t.goals.subtitle}</p>
        </div>
        {ent.isPremium ? (
          <GoalForm />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/upgrade">
              <Lock className="size-4" /> {t.goals.add} — {t.free.premium}
            </Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="rounded-2xl bg-muted p-4">
              <Target className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t.goals.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </>
  );
}
