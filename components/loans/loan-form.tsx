"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createLoan } from "@/lib/actions/loans";
import { useT } from "@/components/locale-provider";
import { todayISO } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateField } from "@/components/ui/date-field";
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

export function LoanForm({ accounts }: { accounts: AccountBalance[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [monthsPaid, setMonthsPaid] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createLoan(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.loans.created);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.loans.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.loans.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lender">{t.loans.lender}</Label>
            <Input id="lender" name="lender" required placeholder="NIC Asia" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="principal">{t.loans.principal}</Label>
              <Input
                id="principal"
                name="principal"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                required
                placeholder="10,00,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_interest_rate">{t.loans.rate}</Label>
              <Input
                id="annual_interest_rate"
                name="annual_interest_rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">{t.loans.startDate}</Label>
            <DateField
              id="start_date"
              name="start_date"
              required
              defaultValue={todayISO()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term_months">{t.loans.term}</Label>
            <Input
              id="term_months"
              name="term_months"
              type="number"
              min="1"
              step="1"
              required
              placeholder="60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="emi_amount">{t.loans.emiKnown}</Label>
              <Input
                id="emi_amount"
                name="emi_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="15,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi_day">{t.loans.emiDay}</Label>
              <Input
                id="emi_day"
                name="emi_day"
                type="number"
                min="1"
                max="31"
                step="1"
                placeholder="10"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {t.loans.emiDayHint}
          </p>
          <div className="space-y-2">
            <Label htmlFor="months_paid">{t.loans.monthsPaid}</Label>
            <Input
              id="months_paid"
              name="months_paid"
              type="number"
              min="0"
              step="1"
              value={monthsPaid}
              onChange={(e) =>
                setMonthsPaid(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t.loans.monthsPaidHint}
            </p>
          </div>
          {monthsPaid === 0 && (
            <div className="space-y-2">
              <Label>{t.loans.depositTo}</Label>
              <Select name="deposit_account_id" required>
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
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.loans.creating : t.loans.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
