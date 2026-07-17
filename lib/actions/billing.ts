"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PLAN_POINTS } from "@/lib/billing";

const requestSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  plan: z.enum(["monthly", "half_yearly", "yearly", "lifetime"]),
  pay_method: z.enum([
    "esewa",
    "khalti",
    "nepal_sbi",
    "global_ime",
    "laxmi_sunrise",
  ]),
});

export type BillingFormState = { error?: string; success?: boolean } | null;

export async function submitPaymentRequest(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const screenshot = formData.get("screenshot");
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return { error: "Payment screenshot is required." };
  }
  if (screenshot.size > 5 * 1024 * 1024) {
    return { error: "Screenshot must be under 5 MB." };
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(screenshot.type)) {
    return { error: "Screenshot must be a PNG, JPG or WebP image." };
  }

  const ext = screenshot.name.split(".").pop() ?? "png";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payments")
    .upload(path, screenshot);
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("payment_requests").insert({
    user_id: user.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    plan: parsed.data.plan,
    pay_method: parsed.data.pay_method,
    screenshot_path: path,
  });
  if (error) return { error: error.message };

  revalidatePath("/upgrade");
  return { success: true };
}

// ---------- Admin ----------

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "super_admin" ? supabase : null;
}

export async function reviewPaymentRequest(
  requestId: string,
  action: "approved" | "rejected",
  plan: string,
  note?: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await requireSuperAdmin();
  if (!supabase) return { error: "Not authorized." };

  const points =
    action === "approved" && plan !== "lifetime"
      ? PLAN_POINTS[plan as keyof typeof PLAN_POINTS]
      : null;

  const { error } = await supabase.rpc("review_payment_request", {
    p_request_id: requestId,
    p_action: action,
    p_points: points,
    p_note: note ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function adjustUserPoints(
  userId: string,
  delta: number,
  note?: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await requireSuperAdmin();
  if (!supabase) return { error: "Not authorized." };
  if (!Number.isInteger(delta) || delta === 0) {
    return { error: "Delta must be a non-zero integer." };
  }

  const { error } = await supabase.rpc("adjust_points", {
    p_user_id: userId,
    p_delta: delta,
    p_note: note ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function getPaymentScreenshotUrl(
  path: string,
): Promise<{ error?: string; url?: string }> {
  const supabase = await requireSuperAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { data, error } = await supabase.storage
    .from("payments")
    .createSignedUrl(path, 60 * 10);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
