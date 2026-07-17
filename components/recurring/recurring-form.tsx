"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createRecurring } from "@/lib/actions/recurring";
import { useT } from "@/components/locale-provider";
import { todayISO } from "@/lib/finance";
import type { TransactionType, AccountBalance } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RecurringForm({
  accounts,
  incomeCategories,
  expenseCategories,
}: {
  accounts: AccountBalance[];
  incomeCategories: AccountBalance[];
  expenseCategories: AccountBalance[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [pending, startTransition] = useTransition();

  const categories = type === "income" ? incomeCategories : expenseCategories;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      const result = await createRecurring(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.recur.created);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.recur.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.recur.add}</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1">
              {t.tx.expense}
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              {t.tx.income}
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex-1">
              {t.tx.transfer}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t.tx.amount}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>{type === "transfer" ? t.tx.fromAccount : t.tx.account}</Label>
            <Select name="account_id" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.tx.chooseAccount} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "transfer" ? (
            <div className="space-y-2">
              <Label>{t.tx.toAccount}</Label>
              <Select name="counter_account_id" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.tx.chooseTarget} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t.tx.category}</Label>
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
          )}

          <div className="space-y-2">
            <Label>{t.recur.frequency}</Label>
            <Select name="frequency" defaultValue="monthly" required>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t.recur.weekly}</SelectItem>
                <SelectItem value="monthly">{t.recur.monthly}</SelectItem>
                <SelectItem value="yearly">{t.recur.yearly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_run">{t.recur.startDate}</Label>
            <DateField
              id="next_run"
              name="next_run"
              required
              defaultValue={todayISO()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.tx.remarks}</Label>
            <Input
              id="description"
              name="description"
              placeholder="Salary, Rent, Netflix…"
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.recur.saving : t.recur.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
