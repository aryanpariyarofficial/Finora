"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { CALENDAR_COOKIE, LOCALE_COOKIE } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

/** Saves the display preferences chosen during onboarding (and applies them). */
export async function setDisplayPreferences(
  locale: string,
  calendar: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!["en", "ne"].includes(locale)) return { error: "Unsupported language." };
  if (!["ad", "bs"].includes(calendar)) {
    return { error: "Unsupported calendar." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ locale, calendar })
    .eq("id", user.id);
  if (error) return { error: error.message };

  const store = await cookies();
  const opts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;
  store.set(LOCALE_COOKIE, locale, opts);
  store.set(CALENDAR_COOKIE, calendar, opts);

  revalidatePath("/", "layout");
  return { success: true };
}

/** Marks onboarding complete so the guide no longer appears. */
export async function completeOnboarding(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
