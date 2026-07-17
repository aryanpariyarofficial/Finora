"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/locale-provider";
import type { AccountBalance } from "@/lib/types";

export function FilterBar({
  accounts,
  categories,
}: {
  accounts: AccountBalance[];
  categories: AccountBalance[];
}) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/transactions?${params.toString()}`);
  }

  const hasFilters = [...searchParams.keys()].length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          setParam("q", String(q ?? ""));
        }}
      >
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder={t.tx.search}
          className="w-56 pl-8"
          defaultValue={searchParams.get("q") ?? ""}
        />
      </form>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.tx.allTypes}</SelectItem>
          <SelectItem value="income">{t.tx.income}</SelectItem>
          <SelectItem value="expense">{t.tx.expense}</SelectItem>
          <SelectItem value="transfer">{t.tx.transfer}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("account") ?? "all"}
        onValueChange={(v) => setParam("account", v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.tx.allAccounts}</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(v) => setParam("category", v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.tx.allCategories}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-36"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value)}
        aria-label="From date"
      />
      <Input
        type="date"
        className="w-36"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value)}
        aria-label="To date"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/transactions")}
        >
          <X className="size-4" /> {t.tx.clear}
        </Button>
      )}
    </div>
  );
}
