"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";

const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  target_amount: z.coerce.number().positive("Target must be greater than zero"),
  saved_amount: z.coerce.number().min(0).default(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export type GoalFormState = { error?: string; success?: boolean } | null;

const PREMIUM_ERROR = {
  error: "Savings goals are a premium feature. Upgrade to unlock.",
};

export async function createGoal(
  _prev: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: v.name,
    target_amount: v.target_amount,
    saved_amount: v.saved_amount || 0,
    target_date: v.target_date || null,
    achieved_at:
      v.saved_amount >= v.target_amount ? new Date().toISOString() : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/goals");
  return { success: true };
}

export async function addContribution(
  id: string,
  amount: number,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!Number.isFinite(amount) || amount === 0) {
    return { error: "Enter a valid amount." };
  }

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("saved_amount, target_amount")
    .eq("id", id)
    .single();
  if (!goal) return { error: "Goal not found." };

  const next = Math.max(0, Number(goal.saved_amount) + amount);
  const { error } = await supabase
    .from("savings_goals")
    .update({
      saved_amount: next,
      achieved_at:
        next >= Number(goal.target_amount) ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoal(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true };
}
