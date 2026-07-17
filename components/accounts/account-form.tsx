"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createAccount } from "@/lib/actions/accounts";
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
        toast.success("Account created");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="NIC Asia, Global IME, IME Pay…"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select name="subtype" defaultValue="bank">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="wallet">Wallet (eSewa, Khalti…)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening_balance">Opening balance (Rs.)</Label>
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
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
