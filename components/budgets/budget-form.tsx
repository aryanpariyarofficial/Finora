"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { saveBudget } from "@/lib/actions/budgets";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountBalance } from "@/lib/types";

export function BudgetForm({
  categories,
  month,
}: {
  categories: AccountBalance[];
  month: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveBudget(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.budgets.saved);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.budgets.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.budgets.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="month" value={month} />
          <div className="space-y-2">
            <Label>{t.budgets.category}</Label>
            <Select name="category_id" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.tx.chooseCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{t.budgets.limit}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              required
              placeholder="20000"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.budgets.saving : t.budgets.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
