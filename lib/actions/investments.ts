"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";

const investmentSchema = z.object({
  type: z.enum(["fd", "shares", "crypto", "gold", "mutual_fund", "business", "other"]),
  name: z.string().trim().min(1, "Name is required").max(100),
  invested_amount: z.coerce.number().positive("Amount must be greater than zero"),
  current_value: z.coerce.number().min(0),
  expected_return_pct: z.coerce.number().min(0).max(1000).optional().or(z.literal("")),
  invested_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  matures_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export type InvestmentFormState = { error?: string; success?: boolean } | null;

const PREMIUM_ERROR = {
  error: "Investments are a premium feature. Upgrade to unlock.",
};

export async function createInvestment(
  _prev: InvestmentFormState,
  formData: FormData,
): Promise<InvestmentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const parsed = investmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const { data: investment, error } = await supabase
    .from("investments")
    .insert({
      user_id: user.id,
      type: v.type,
      name: v.name,
      invested_amount: v.invested_amount,
      current_value: v.current_value || v.invested_amount,
      expected_return_pct: v.expected_return_pct || null,
      invested_on: v.invested_on,
      matures_on: v.matures_on || null,
    })
    .select("id, current_value")
    .single();
  if (error) return { error: error.message };

  await supabase.from("investment_history").insert({
    user_id: user.id,
    investment_id: investment.id,
    valued_on: v.invested_on,
    value: investment.current_value,
  });

  revalidatePath("/investments");
  return { success: true };
}

export async function updateInvestmentValue(id: string, value: number): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Enter a valid value." };
  }

  const { error } = await supabase
    .from("investments")
    .update({ current_value: value })
    .eq("id", id);
  if (error) return { error: error.message };

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("investment_history").insert({
    user_id: user.id,
    investment_id: id,
    valued_on: today,
    value,
  });

  revalidatePath("/investments");
  return { success: true };
}

export async function deleteInvestment(id: string): Promise<{ error?: string; success?: boolean }> {
  const ent = await getEntitlements();
  if (!ent.isPremium) return PREMIUM_ERROR;

  const supabase = await createClient();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/investments");
  return { success: true };
}
