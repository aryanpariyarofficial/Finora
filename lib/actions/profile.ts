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
  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) return { error: "Name is required." };
  if (!["NPR", "USD", "INR"].includes(currency)) {
    return { error: "Unsupported currency." };
  }
  if (bio.length > 300) return { error: "Bio must be under 300 characters." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      currency,
      bio: bio || null,
      phone: phone || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function setAvatarUrl(
  url: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
