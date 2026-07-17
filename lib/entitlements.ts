import { createClient } from "@/lib/supabase/server";
import type { Entitlements } from "@/lib/billing";

/**
 * Runs the lazy daily point deduction and returns the fresh entitlement
 * snapshot. Call once per request from layouts/actions that need gating.
 */
export async function getEntitlements(): Promise<Entitlements> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sync_points").single();

  if (error || !data) {
    // Pre-migration fallback: treat as free user rather than crashing.
    return {
      points: 0,
      lifetime: false,
      plan: "free",
      role: "user",
      isPremium: false,
      isSuperAdmin: false,
    };
  }

  const row = data as {
    points: number;
    lifetime: boolean;
    plan: string;
    role: string;
  };

  return {
    points: row.points,
    lifetime: row.lifetime,
    plan: row.plan,
    role: row.role,
    isPremium: row.lifetime || row.points > 0,
    isSuperAdmin: row.role === "super_admin",
  };
}
