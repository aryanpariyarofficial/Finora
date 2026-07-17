"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createInvestment } from "@/lib/actions/investments";
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

export function InvestmentForm() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createInvestment(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.invest.created);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.invest.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.invest.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.invest.type}</Label>
              <Select name="type" defaultValue="fd" required>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.invest.types).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t.invest.name}</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="NIC Asia FD"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invested_amount">{t.invest.invested}</Label>
              <Input
                id="invested_amount"
                name="invested_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">{t.invest.currentValue}</Label>
              <Input
                id="current_value"
                name="current_value"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="= invested"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expected_return_pct">
              {t.invest.expectedReturn}
            </Label>
            <Input
              id="expected_return_pct"
              name="expected_return_pct"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invested_on">{t.invest.investedOn}</Label>
              <DateField
                id="invested_on"
                name="invested_on"
                required
                defaultValue={todayISO()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matures_on">{t.invest.maturesOn}</Label>
              <DateField id="matures_on" name="matures_on" optional />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.invest.saving : t.invest.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
