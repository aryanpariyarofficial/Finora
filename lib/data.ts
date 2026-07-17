import { createClient } from "@/lib/supabase/server";
import { monthStart, todayISO } from "@/lib/finance";
import type {
  AccountBalance,
  TransactionWithNames,
} from "@/lib/types";

export async function getAccounts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_balances")
    .select("*")
    .eq("is_archived", false)
    .order("kind")
    .order("sort_order");
  return (data ?? []) as AccountBalance[];
}

const TRANSACTION_SELECT = `
  *,
  account:accounts!transactions_account_id_fkey (name),
  category:accounts!transactions_category_id_fkey (name, icon),
  counter_account:accounts!transactions_counter_account_id_fkey (name)
`;

export async function getRecentTransactions(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as TransactionWithNames[];
}

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  accountId?: string;
  from?: string;
  to?: string;
  q?: string;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.from) query = query.gte("occurred_on", filters.from);
  if (filters.to) query = query.lte("occurred_on", filters.to);
  if (filters.q) {
    query = query.or(
      `description.ilike.%${filters.q}%,location.ilike.%${filters.q}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as unknown as TransactionWithNames[];
}

export interface MonthlySummary {
  income: number;
  expense: number;
  todayIncome: number;
  todayExpense: number;
}

export async function getMonthlySummary(): Promise<MonthlySummary> {
  const supabase = await createClient();
  const start = monthStart();
  const today = todayISO();

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, occurred_on")
    .gte("occurred_on", start)
    .in("type", ["income", "expense"]);

  const rows = data ?? [];
  const sum = (
    pred: (r: { type: string; amount: number; occurred_on: string }) => boolean,
  ) => rows.filter(pred).reduce((acc, r) => acc + Number(r.amount), 0);

  return {
    income: sum((r) => r.type === "income"),
    expense: sum((r) => r.type === "expense"),
    todayIncome: sum((r) => r.type === "income" && r.occurred_on === today),
    todayExpense: sum((r) => r.type === "expense" && r.occurred_on === today),
  };
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export async function getCategoryTotals(
  type: "income" | "expense",
  from: string,
): Promise<CategoryTotal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount, category:accounts!transactions_category_id_fkey (name)")
    .eq("type", type)
    .gte("occurred_on", from);

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const name =
      (row.category as unknown as { name: string } | null)?.name ?? "Other";
    totals.set(name, (totals.get(name) ?? 0) + Number(row.amount));
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthPoint {
  month: string; // "2026-07"
  label: string; // "Jul"
  income: number;
  expense: number;
}

export async function getCashflowByMonth(months = 6): Promise<MonthPoint[]> {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(1);
  start.setMonth(start.getMonth() - (months - 1));
  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, occurred_on")
    .gte("occurred_on", from)
    .in("type", ["income", "expense"]);

  const points: MonthPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    points.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      income: 0,
      expense: 0,
    });
  }

  for (const row of data ?? []) {
    const key = row.occurred_on.slice(0, 7);
    const point = points.find((p) => p.month === key);
    if (!point) continue;
    if (row.type === "income") point.income += Number(row.amount);
    else point.expense += Number(row.amount);
  }

  return points;
}
