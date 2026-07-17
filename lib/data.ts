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

// ---------- Budgets ----------

export interface BudgetWithSpend {
  id: string;
  category_id: string;
  category_name: string;
  month: string;
  amount: number;
  spent: number;
}

export async function getBudgetsWithSpend(
  month: string,
): Promise<BudgetWithSpend[]> {
  const supabase = await createClient();
  const monthEnd = new Date(`${month}T00:00:00`);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const to = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: budgets }, { data: txs }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, category_id, month, amount, category:accounts!budgets_category_id_fkey (name)")
      .eq("month", month),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("occurred_on", month)
      .lt("occurred_on", to),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const tx of txs ?? []) {
    if (!tx.category_id) continue;
    spentByCategory.set(
      tx.category_id,
      (spentByCategory.get(tx.category_id) ?? 0) + Number(tx.amount),
    );
  }

  return (budgets ?? [])
    .map((b) => ({
      id: b.id,
      category_id: b.category_id,
      category_name:
        (b.category as unknown as { name: string } | null)?.name ?? "?",
      month: b.month,
      amount: Number(b.amount),
      spent: spentByCategory.get(b.category_id) ?? 0,
    }))
    .sort((a, b) => b.spent / b.amount - a.spent / a.amount);
}

// ---------- Loans ----------

export interface LoanWithStatus {
  id: string;
  lender: string;
  principal: number;
  annual_interest_rate: number;
  start_date: string;
  term_months: number;
  emi_amount: number | null;
  status: string;
  liability_account_id: string;
  outstanding: number;
  principal_paid: number;
  interest_paid: number;
  payments_count: number;
}

export async function getLoans(): Promise<LoanWithStatus[]> {
  const supabase = await createClient();
  const [{ data: loans }, { data: balances }, { data: payments }] =
    await Promise.all([
      supabase.from("loans").select("*").order("created_at"),
      supabase
        .from("account_balances")
        .select("id, balance")
        .eq("kind", "liability"),
      supabase
        .from("loan_payments")
        .select("loan_id, principal_component, interest_component"),
    ]);

  const balanceById = new Map(
    (balances ?? []).map((b) => [b.id, Number(b.balance)]),
  );

  return (loans ?? []).map((loan) => {
    const loanPayments = (payments ?? []).filter(
      (p) => p.loan_id === loan.id,
    );
    return {
      ...loan,
      principal: Number(loan.principal),
      annual_interest_rate: Number(loan.annual_interest_rate),
      emi_amount: loan.emi_amount != null ? Number(loan.emi_amount) : null,
      outstanding: balanceById.get(loan.liability_account_id) ?? 0,
      principal_paid: loanPayments.reduce(
        (acc, p) => acc + Number(p.principal_component),
        0,
      ),
      interest_paid: loanPayments.reduce(
        (acc, p) => acc + Number(p.interest_component),
        0,
      ),
      payments_count: loanPayments.length,
    };
  });
}

// ---------- Investments ----------

export interface InvestmentRow {
  id: string;
  type: string;
  name: string;
  invested_amount: number;
  current_value: number;
  expected_return_pct: number | null;
  invested_on: string;
  matures_on: string | null;
}

export async function getInvestments(): Promise<InvestmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investments")
    .select("*")
    .order("invested_on", { ascending: false });

  return (data ?? []).map((inv) => ({
    ...inv,
    invested_amount: Number(inv.invested_amount),
    current_value: Number(inv.current_value),
    expected_return_pct:
      inv.expected_return_pct != null ? Number(inv.expected_return_pct) : null,
  }));
}

// ---------- Reports ----------

export interface ReportData {
  income: number;
  expense: number;
  txCount: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
  monthly: MonthPoint[];
}

export async function getReportData(
  from: string,
  to: string,
): Promise<ReportData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(
      "type, amount, occurred_on, category:accounts!transactions_category_id_fkey (name)",
    )
    .gte("occurred_on", from)
    .lte("occurred_on", to)
    .in("type", ["income", "expense"]);

  const rows = data ?? [];
  const incomeByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();
  const monthly = new Map<string, { income: number; expense: number }>();
  let income = 0;
  let expense = 0;

  for (const row of rows) {
    const amount = Number(row.amount);
    const category =
      (row.category as unknown as { name: string } | null)?.name ?? "Other";
    const monthKey = row.occurred_on.slice(0, 7);
    const bucket = monthly.get(monthKey) ?? { income: 0, expense: 0 };

    if (row.type === "income") {
      income += amount;
      bucket.income += amount;
      incomeByCategory.set(
        category,
        (incomeByCategory.get(category) ?? 0) + amount,
      );
    } else {
      expense += amount;
      bucket.expense += amount;
      expenseByCategory.set(
        category,
        (expenseByCategory.get(category) ?? 0) + amount,
      );
    }
    monthly.set(monthKey, bucket);
  }

  const toTotals = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

  const monthlyPoints: MonthPoint[] = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      income: v.income,
      expense: v.expense,
    }));

  return {
    income,
    expense,
    txCount: rows.length,
    incomeByCategory: toTotals(incomeByCategory),
    expenseByCategory: toTotals(expenseByCategory),
    monthly: monthlyPoints,
  };
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
