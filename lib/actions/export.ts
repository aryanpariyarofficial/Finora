"use server";

import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";

export interface ExportBundle {
  exportedAt: string;
  accounts: unknown[];
  transactions: unknown[];
  budgets: unknown[];
  loans: unknown[];
  loanPayments: unknown[];
  investments: unknown[];
  recurring: unknown[];
  goals: unknown[];
}

/** Returns the user's full dataset for backup/export. Premium only. */
export async function getAllUserData(): Promise<
  { data: ExportBundle } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) {
    return { error: "Data export is a premium feature. Upgrade to unlock." };
  }

  const [
    accounts,
    transactions,
    budgets,
    loans,
    loanPayments,
    investments,
    recurring,
    goals,
  ] = await Promise.all([
    supabase.from("account_balances").select("*"),
    supabase
      .from("transactions")
      .select(
        `id, type, amount, occurred_on, payment_method, description, location, created_at,
         account:accounts!transactions_account_id_fkey (name),
         category:accounts!transactions_category_id_fkey (name),
         counter_account:accounts!transactions_counter_account_id_fkey (name)`,
      )
      .order("occurred_on", { ascending: false }),
    supabase.from("budgets").select("*"),
    supabase.from("loans").select("*"),
    supabase.from("loan_payments").select("*"),
    supabase.from("investments").select("*"),
    supabase.from("recurring_transactions").select("*"),
    supabase.from("savings_goals").select("*"),
  ]);

  return {
    data: {
      exportedAt: new Date().toISOString(),
      accounts: accounts.data ?? [],
      transactions: transactions.data ?? [],
      budgets: budgets.data ?? [],
      loans: loans.data ?? [],
      loanPayments: loanPayments.data ?? [],
      investments: investments.data ?? [],
      recurring: recurring.data ?? [],
      goals: goals.data ?? [],
    },
  };
}
