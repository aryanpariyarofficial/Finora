"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { saveTransaction } from "@/lib/actions/transactions";
import { todayISO } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
import {
  PAYMENT_METHOD_LABELS,
  type AccountBalance,
  type Transaction,
  type TransactionType,
} from "@/lib/types";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  accounts: AccountBalance[]; // money accounts (asset/liability)
  incomeCategories: AccountBalance[];
  expenseCategories: AccountBalance[];
  transaction?: Transaction; // present = edit mode
  trigger?: React.ReactNode;
  defaultType?: TransactionType;
  allowTransfer?: boolean;
}

export function TransactionForm({
  accounts,
  incomeCategories,
  expenseCategories,
  transaction,
  trigger,
  defaultType = "expense",
  allowTransfer = true,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? defaultType,
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveTransaction(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(transaction ? t.tx.updated : t.tx.added);
        setOpen(false);
      }
    });
  }

  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> {t.tx.add}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? t.tx.edit : t.tx.add}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={type}
          onValueChange={(v) => setType(v as TransactionType)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1">
              {t.tx.expense}
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              {t.tx.income}
            </TabsTrigger>
            {allowTransfer && (
              <TabsTrigger value="transfer" className="flex-1">
                {t.tx.transfer}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {transaction && (
            <input type="hidden" name="id" value={transaction.id} />
          )}
          <input type="hidden" name="type" value={type} />

          <div className="grid grid-cols-2 gap-3">
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
                defaultValue={transaction?.amount}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurred_on">{t.tx.date}</Label>
              <Input
                id="occurred_on"
                name="occurred_on"
                type="date"
                required
                defaultValue={transaction?.occurred_on ?? todayISO()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {type === "transfer" ? t.tx.fromAccount : t.tx.account}
            </Label>
            <Select
              name="account_id"
              defaultValue={transaction?.account_id}
              required
            >
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
              <Select
                name="counter_account_id"
                defaultValue={transaction?.counter_account_id ?? undefined}
                required
              >
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
              <Select
                name="category_id"
                defaultValue={transaction?.category_id ?? undefined}
                required
              >
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.tx.paymentMethod}</Label>
              <Select
                name="payment_method"
                defaultValue={transaction?.payment_method ?? undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.tx.optional} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.tx.location}</Label>
              <Input
                id="location"
                name="location"
                defaultValue={transaction?.location ?? ""}
                placeholder={t.tx.optional}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.tx.remarks}</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={transaction?.description ?? ""}
              placeholder={t.tx.optionalNote}
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.tx.saving : transaction ? t.tx.saveChanges : t.tx.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
