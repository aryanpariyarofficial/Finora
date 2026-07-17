"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CircleDollarSign,
  Landmark,
  Pencil,
  Wallet,
} from "lucide-react";
import { setAccountBalance } from "@/lib/actions/accounts";
import { formatMoney } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
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
import type { AccountBalance } from "@/lib/types";

const subtypeIcon = {
  cash: Banknote,
  bank: Landmark,
  wallet: Wallet,
} as const;

export function AccountCard({ account }: { account: AccountBalance }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const Icon =
    subtypeIcon[account.subtype as keyof typeof subtypeIcon] ??
    CircleDollarSign;
  const balance =
    account.kind === "liability" ? -account.balance : account.balance;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("balance"));
    startTransition(async () => {
      const result = await setAccountBalance(account.id, value);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(t.accounts.balanceSaved);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{account.name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {account.subtype ?? account.kind}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">
                {formatMoney(balance)}
              </p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <Pencil className="size-3" /> {t.accounts.tapToSet}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.accounts.setBalanceFor} — {account.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t.accounts.currentBalanceLabel}:{" "}
            <span className="font-medium text-foreground">
              {formatMoney(balance)}
            </span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="balance">{t.accounts.newBalance}</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              autoFocus
              defaultValue={balance}
              placeholder="5000"
            />
            <p className="text-xs text-muted-foreground">
              {t.accounts.newBalanceHint}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.accounts.creating : t.accounts.saveBalance}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
