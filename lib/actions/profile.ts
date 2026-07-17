"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; success?: boolean } | null;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "NPR");

  if (!fullName) return { error: "Name is required." };
  if (!["NPR", "USD", "INR"].includes(currency)) {
    return { error: "Unsupported currency." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, currency })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
