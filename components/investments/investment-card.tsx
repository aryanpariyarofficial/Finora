"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import {
  deleteInvestment,
  updateInvestmentValue,
} from "@/lib/actions/investments";
import { useFormatDate, useT } from "@/components/locale-provider";
import { formatMoney } from "@/lib/finance";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InvestmentRow } from "@/lib/data";

export function InvestmentCard({
  investment,
  canEdit,
}: {
  investment: InvestmentRow;
  canEdit: boolean;
}) {
  const t = useT();
  const formatDate = useFormatDate();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const profit = investment.current_value - investment.invested_amount;
  const roi =
    investment.invested_amount > 0
      ? (profit / investment.invested_amount) * 100
      : 0;
  const gain = profit >= 0;

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("value"));
    startTransition(async () => {
      const result = await updateInvestmentValue(investment.id, value);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.invest.updated);
        setOpen(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{investment.name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            <Badge variant="secondary" className="mr-2">
              {t.invest.types[
                investment.type as keyof typeof t.invest.types
              ] ?? investment.type}
            </Badge>
            {formatDate(investment.invested_on)}
            {investment.matures_on && ` → ${formatDate(investment.matures_on)}`}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCcw className="size-3.5" /> {t.invest.updateValue}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>{t.invest.updateValue}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`value-${investment.id}`}>
                      {t.invest.newValue}
                    </Label>
                    <Input
                      id={`value-${investment.id}`}
                      name="value"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={investment.current_value}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? t.invest.saving : t.invest.updateValue}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <ConfirmDelete
              action={() => deleteInvestment(investment.id)}
              successMessage={t.invest.deleted}
              ariaLabel="Delete investment"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">{t.invest.invested}</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(investment.invested_amount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t.invest.currentValue}</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(investment.current_value)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {gain ? t.invest.profit : t.invest.loss}
            </p>
            <p
              className={cn(
                "font-semibold tabular-nums",
                gain ? "text-[var(--success)]" : "text-destructive",
              )}
            >
              {formatMoney(profit, { signed: true })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t.invest.roi}</p>
            <p
              className={cn(
                "flex items-center gap-1 font-semibold tabular-nums",
                gain ? "text-[var(--success)]" : "text-destructive",
              )}
            >
              {gain ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
