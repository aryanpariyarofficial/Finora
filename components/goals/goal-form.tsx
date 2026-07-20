"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createGoal } from "@/lib/actions/goals";
import { useCalendar, useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const t = useT();
  const calendar = useCalendar();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createGoal(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.goals.created);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.goals.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.goals.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.goals.name}</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder={t.goals.namePlaceholder}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="target_amount">{t.goals.target}</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                required
                placeholder="100000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saved_amount">{t.goals.saved}</Label>
              <Input
                id="saved_amount"
                name="saved_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_date">{t.goals.targetDate}</Label>
            <DateField id="target_date" name="target_date" optional />
            {calendar === "bs" && (
              <p className="text-xs text-muted-foreground">
                {t.goals.bsLongTermNote}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.goals.creating : t.goals.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
