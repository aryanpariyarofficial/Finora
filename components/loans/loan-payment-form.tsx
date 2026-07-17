"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import { recordLoanPayment } from "@/lib/actions/loans";
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

export function LoanPaymentForm({
  loanId,
  lender,
  defaultAmount,
  accounts,
}: {
  loanId: string;
  lender: string;
  defaultAmount: number | null;
  accounts: AccountBalance[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await recordLoanPayment(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.loans.paymentSaved);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <HandCoins className="size-4" /> {t.loans.recordPayment}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.loans.recordPayment} — {lender}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="loan_id" value={loanId} />
          <div className="space-y-2">
            <Label htmlFor="amount">{t.loans.paymentAmount}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              required
              defaultValue={defaultAmount ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paid_on">{t.loans.paidOn}</Label>
            <Input
              id="paid_on"
              name="paid_on"
              type="date"
              required
              defaultValue={todayISO()}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.loans.fromAccount}</Label>
            <Select name="from_account_id" required>
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.tx.saving : t.loans.recordPayment}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
