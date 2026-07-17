"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createAccount } from "@/lib/actions/accounts";
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

export function AccountForm() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAccount(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t.accounts.created);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.accounts.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.accounts.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.accounts.name}</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="NIC Asia, Global IME, IME Pay…"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.accounts.type}</Label>
            <Select name="subtype" defaultValue="bank">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t.accounts.cash}</SelectItem>
                <SelectItem value="bank">{t.accounts.bank}</SelectItem>
                <SelectItem value="wallet">{t.accounts.wallet}</SelectItem>
                <SelectItem value="other">{t.accounts.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening_balance">{t.accounts.openingBalance}</Label>
            <Input
              id="opening_balance"
              name="opening_balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.accounts.creating : t.accounts.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
