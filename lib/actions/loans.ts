"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { calculateEMI } from "@/lib/finance";

const loanSchema = z
  .object({
    lender: z.string().trim().min(1, "Lender is required").max(100),
    principal: z.coerce.number().positive("Loan amount must be greater than zero"),
    annual_interest_rate: z.coerce.number().min(0).max(100),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    term_months: z.coerce.number().int().positive("Duration must be at least 1 month"),
    months_paid: z.coerce.number().int().min(0).default(0),
    // Required only for brand-new loans (months_paid = 0).
    deposit_account_id: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((v) => v.months_paid < v.term_months, {
    message: "Months already paid must be less than the loan duration.",
  })
  .refine((v) => v.months_paid > 0 || !!v.deposit_account_id, {
    message: "Choose a deposit account.",
  });

const paymentSchema = z.object({
  loan_id: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  from_account_id: z.string().uuid("Choose an account"),
});

export type LoanFormState = { error?: string; success?: boolean } | null;

const PREMIUM_ERROR = {
  error: "Loans are a premium feature. Upgrade to unlock.",
};

export async function createLoan(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const parsed = loanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  // 1. Liability account to carry the outstanding balance.
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: `Loan — ${v.lender}`,
      kind: "liability",
      subtype: "loan",
      icon: "landmark",
    })
    .select("id")
    .single();
  if (accountError) {
    return {
      error:
        accountError.code === "23505"
          ? "A loan from that lender already exists — use a different name."
          : accountError.message,
    };
  }

  // 2. Loan record with the calculated EMI.
  const emi = calculateEMI(v.principal, v.annual_interest_rate, v.term_months);
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert({
      user_id: user.id,
      liability_account_id: account.id,
      lender: v.lender,
      principal: v.principal,
      annual_interest_rate: v.annual_interest_rate,
      start_date: v.start_date,
      term_months: v.term_months,
      emi_amount: Math.round(emi * 100) / 100,
    })
    .select("id")
    .single();
  if (loanError) return { error: loanError.message };

  if (v.months_paid === 0) {
    // 3a. New loan: disbursement transfers the principal from the loan
    // liability into the chosen asset account — the ledger stays balanced.
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "transfer",
      amount: v.principal,
      occurred_on: v.start_date,
      account_id: account.id,
      counter_account_id: v.deposit_account_id,
      description: `Loan disbursement — ${v.lender}`,
    });
    if (txError) return { error: txError.message };
  } else {
    // 3b. Existing loan: the money was received and spent long ago, so we
    // don't touch today's accounts. Replay the amortization for the months
    // already paid to get the correct outstanding balance and history,
    // then book only that outstanding as a liability opening adjustment.
    const monthlyRate = v.annual_interest_rate / 12 / 100;
    let balance = v.principal;
    const paidRows = [];

    for (let m = 1; m <= v.months_paid; m++) {
      const interest = balance * monthlyRate;
      const principalPart = Math.min(emi - interest, balance);
      balance -= principalPart;

      const paidOn = new Date(`${v.start_date}T00:00:00`);
      paidOn.setMonth(paidOn.getMonth() + m);
      paidRows.push({
        user_id: user.id,
        loan_id: loan.id,
        paid_on: `${paidOn.getFullYear()}-${String(paidOn.getMonth() + 1).padStart(2, "0")}-${String(paidOn.getDate()).padStart(2, "0")}`,
        principal_component: Math.round(principalPart * 100) / 100,
        interest_component: Math.round(interest * 100) / 100,
      });
    }

    const { error: paymentsError } = await supabase
      .from("loan_payments")
      .insert(paidRows);
    if (paymentsError) return { error: paymentsError.message };

    const outstanding = Math.round(balance * 100) / 100;
    if (outstanding > 0) {
      const { data: equity } = await supabase
        .from("accounts")
        .select("id")
        .eq("kind", "equity")
        .eq("is_system", true)
        .limit(1)
        .single();
      if (!equity) return { error: "Opening Balances account not found." };

      // Credit the liability, debit equity: outstanding shows correctly
      // without touching any money account.
      const { error: adjError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "adjustment",
        amount: outstanding,
        occurred_on: v.start_date,
        account_id: account.id,
        counter_account_id: equity.id,
        description: `Existing loan opening balance — ${v.lender}`,
      });
      if (adjError) return { error: adjError.message };
    }
  }

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: true };
}

/**
 * Records an EMI payment: the interest slice books as an expense and the
 * principal slice transfers from the paying account into the loan
 * liability, reducing the outstanding balance.
 */
export async function recordLoanPayment(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", v.loan_id)
    .single();
  if (!loan) return { error: "Loan not found." };

  const { data: balanceRow } = await supabase
    .from("account_balances")
    .select("balance")
    .eq("id", loan.liability_account_id)
    .single();
  const outstanding = Number(balanceRow?.balance ?? 0);
  if (outstanding <= 0) return { error: "This loan is already paid off." };

  const monthlyRate = Number(loan.annual_interest_rate) / 12 / 100;
  const interest = Math.min(
    Math.round(outstanding * monthlyRate * 100) / 100,
    v.amount,
  );
  const principal = Math.min(v.amount - interest, outstanding);

  // Interest → expense against a dedicated category.
  if (interest > 0) {
    let { data: interestCategory } = await supabase
      .from("accounts")
      .select("id")
      .eq("kind", "expense")
      .eq("name", "Loan Interest")
      .maybeSingle();

    if (!interestCategory) {
      const { data: created, error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name: "Loan Interest",
          kind: "expense",
          icon: "percent",
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      interestCategory = created;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: interest,
      occurred_on: v.paid_on,
      account_id: v.from_account_id,
      category_id: interestCategory.id,
      description: `Loan interest — ${loan.lender}`,
    });
    if (error) return { error: error.message };
  }

  // Principal → transfer into the liability (reduces outstanding).
  if (principal > 0) {
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "transfer",
      amount: principal,
      occurred_on: v.paid_on,
      account_id: v.from_account_id,
      counter_account_id: loan.liability_account_id,
      description: `Loan EMI — ${loan.lender}`,
    });
    if (error) return { error: error.message };
  }

  const { error: paymentError } = await supabase.from("loan_payments").insert({
    user_id: user.id,
    loan_id: loan.id,
    paid_on: v.paid_on,
    principal_component: principal,
    interest_component: interest,
  });
  if (paymentError) return { error: paymentError.message };

  // Close the loan when fully repaid.
  if (outstanding - principal <= 0.005) {
    await supabase.from("loans").update({ status: "closed" }).eq("id", loan.id);
  }

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  return { success: true };
}
