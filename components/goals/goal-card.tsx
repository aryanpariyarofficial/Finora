"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PiggyBank, Plus } from "lucide-react";
import { addContribution, deleteGoal } from "@/lib/actions/goals";
import { useFormatDate, useT } from "@/components/locale-provider";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  achieved_at: string | null;
}

export function GoalCard({ goal }: { goal: Goal }) {
  const t = useT();
  const formatDate = useFormatDate();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pct = Math.min(
    100,
    Math.round((goal.saved_amount / goal.target_amount) * 100),
  );
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const achieved = goal.achieved_at != null || goal.saved_amount >= goal.target_amount;

  function contribute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    startTransition(async () => {
      const res = await addContribution(goal.id, amount);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(t.goals.added);
        setOpen(false);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[oklch(0.63_0.21_355)]/10 p-2">
              <PiggyBank className="size-4 text-[oklch(0.63_0.21_355)]" />
            </span>
            <div>
              <p className="font-medium">{goal.name}</p>
              {goal.target_date && (
                <p className="text-xs text-muted-foreground">
                  {t.goals.by} {formatDate(goal.target_date)}
                </p>
              )}
            </div>
          </div>
          <ConfirmDelete
            action={() => deleteGoal(goal.id)}
            successMessage={t.goals.deleted}
            ariaLabel={t.goals.deleted}
          />
        </div>

        <Progress value={pct} />

        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold tabular-nums">
            <Money value={goal.saved_amount} />
            <span className="font-normal text-muted-foreground">
              {" "}
              {t.goals.of} <Money value={goal.target_amount} />
            </span>
          </span>
          {achieved ? (
            <Badge className="bg-[var(--success)] text-white">
              {t.goals.achieved}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              <Money value={remaining} /> {t.goals.left}
            </span>
          )}
        </div>

        {!achieved && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="size-4" /> {t.goals.contribute}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>
                  {t.goals.contribute} — {goal.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={contribute} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`amt-${goal.id}`}>
                    {t.goals.contributeAmount}
                  </Label>
                  <Input
                    id={`amt-${goal.id}`}
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1"
                    required
                    autoFocus
                    placeholder="5000"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? t.goals.creating : t.goals.add2}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
