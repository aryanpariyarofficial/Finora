import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Entitlements } from "@/lib/billing";

/**
 * Runs the lazy daily point deduction and returns the fresh entitlement
 * snapshot. Wrapped in React cache() so the layout and the page share a
 * single sync_points RPC per request instead of running it 2-3 times.
 */
export const getEntitlements = cache(async (): Promise<Entitlements> => {
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
});
