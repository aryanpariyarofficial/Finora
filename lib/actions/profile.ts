"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { CALENDAR_COOKIE, LOCALE_COOKIE } from "@/lib/i18n/server";
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
  const locale = String(formData.get("locale") ?? "en");
  const calendar = String(formData.get("calendar") ?? "ad");

  if (!fullName) return { error: "Name is required." };
  if (!["NPR", "USD", "INR"].includes(currency)) {
    return { error: "Unsupported currency." };
  }
  if (!["en", "ne"].includes(locale)) return { error: "Unsupported language." };
  if (!["ad", "bs"].includes(calendar)) {
    return { error: "Unsupported calendar." };
  }
  if (bio.length > 300) return { error: "Bio must be under 300 characters." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      currency,
      bio: bio || null,
      phone: phone || null,
      locale,
      calendar,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Apply the preferences immediately for this device too.
  const cookieStore = await cookies();
  const cookieOpts = {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  } as const;
  cookieStore.set(LOCALE_COOKIE, locale, cookieOpts);
  cookieStore.set(CALENDAR_COOKIE, calendar, cookieOpts);

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

  // Only accept avatars from our own storage bucket, under this user's folder.
  const expectedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`;
  if (!url.startsWith(expectedPrefix)) {
    return { error: "Invalid avatar URL." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
