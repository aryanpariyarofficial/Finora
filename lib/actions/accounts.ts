"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  subtype: z.enum(["cash", "bank", "wallet", "other"]),
  opening_balance: z.coerce.number().min(0).default(0),
});

export type AccountFormState = { error?: string; success?: boolean } | null;

export async function createAccount(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: v.name,
      kind: "asset",
      subtype: v.subtype,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "An account with that name already exists." : error.message,
    };
  }

  // Opening balance is booked as an adjustment against Opening Balances equity.
  if (v.opening_balance > 0) {
    const { data: equity } = await supabase
      .from("accounts")
      .select("id")
      .eq("kind", "equity")
      .eq("is_system", true)
      .limit(1)
      .single();

    if (equity) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "adjustment",
        amount: v.opening_balance,
        account_id: equity.id,
        counter_account_id: account.id,
        description: "Opening balance",
      });
    }
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}
