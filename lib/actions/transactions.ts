"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  account_id: z.string().uuid("Choose an account"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  counter_account_id: z.string().uuid().optional().or(z.literal("")),
  payment_method: z
    .enum(["cash", "bank_transfer", "esewa", "khalti", "ime_pay", "card", "cheque", "other"])
    .optional()
    .or(z.literal("")),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
});

export type TransactionFormState = {
  error?: string;
  success?: boolean;
} | null;

export async function saveTransaction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = transactionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const v = parsed.data;

  if (v.type !== "transfer" && !v.category_id) {
    return { error: "Choose a category." };
  }
  if (v.type === "transfer") {
    if (!v.counter_account_id) return { error: "Choose a target account." };
    if (v.counter_account_id === v.account_id) {
      return { error: "Source and target accounts must differ." };
    }
  }

  const row = {
    user_id: user.id,
    type: v.type,
    amount: v.amount,
    occurred_on: v.occurred_on,
    account_id: v.account_id,
    category_id: v.type === "transfer" ? null : v.category_id || null,
    counter_account_id: v.type === "transfer" ? v.counter_account_id : null,
    payment_method: v.payment_method || null,
    description: v.description?.trim() || null,
    location: v.location?.trim() || null,
  };

  const editingId = String(formData.get("id") ?? "");
  const { error } = editingId
    ? await supabase.from("transactions").update(row).eq("id", editingId)
    : await supabase.from("transactions").insert(row);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return { success: true };
}
