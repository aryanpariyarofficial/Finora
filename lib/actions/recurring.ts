"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";

const recurringSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  account_id: z.string().uuid("Choose an account"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  counter_account_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(200).optional(),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  next_run: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export type RecurringFormState = { error?: string; success?: boolean } | null;

const PREMIUM_ERROR = {
  error: "Recurring transactions are a premium feature. Upgrade to unlock.",
};

export async function createRecurring(
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const parsed = recurringSchema.safeParse(Object.fromEntries(formData));
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

  const { error } = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
    type: v.type,
    amount: v.amount,
    account_id: v.account_id,
    category_id: v.type === "transfer" ? null : v.category_id || null,
    counter_account_id: v.type === "transfer" ? v.counter_account_id : null,
    description: v.description?.trim() || null,
    frequency: v.frequency,
    next_run: v.next_run,
  });
  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurring(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}

export async function toggleRecurring(
  id: string,
  active: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}
