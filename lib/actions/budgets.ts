"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";

const budgetSchema = z.object({
  category_id: z.string().uuid("Choose a category"),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, "Invalid month"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export type BudgetFormState = { error?: string; success?: boolean } | null;

export async function saveBudget(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) {
    return { error: "Budgets are a premium feature. Upgrade to unlock." };
  }

  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: parsed.data.category_id,
      month: parsed.data.month,
      amount: parsed.data.amount,
    },
    { onConflict: "user_id,category_id,month" },
  );
  if (error) return { error: error.message };

  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteBudget(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const ent = await getEntitlements();
  if (!ent.isPremium) {
    return { error: "Budgets are a premium feature. Upgrade to unlock." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/budgets");
  return { success: true };
}
