"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string } | null;

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(String(formData.get("next") || "/dashboard"));
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // Email confirmation enabled → no session until the user confirms.
  if (!data.session) {
    return {
      success: "Check your email to confirm your account, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function sendPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    String(formData.get("email") ?? ""),
  );

  if (error) return { error: error.message };
  return { success: "Password reset link sent. Check your email." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
