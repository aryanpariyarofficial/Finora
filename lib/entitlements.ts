import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Entitlements } from "@/lib/billing";

/**
 * Runs the lazy daily point deduction and returns the fresh entitlement
 * snapshot. Wrapped in React cache() so the layout and the page share a
 * single sync_points RPC per request instead of running it 2-3 times.
 */
function toEntitlements(row: {
  points: number;
  lifetime: boolean;
  plan: string;
  role: string;
}): Entitlements {
  return {
    points: row.points,
    lifetime: row.lifetime,
    plan: row.plan,
    role: row.role,
    isPremium: row.lifetime || row.points > 0,
    isSuperAdmin: row.role === "super_admin",
  };
}

const FREE: Entitlements = {
  points: 0,
  lifetime: false,
  plan: "free",
  role: "user",
  isPremium: false,
  isSuperAdmin: false,
};

export const getEntitlements = cache(async (): Promise<Entitlements> => {
  const supabase = await createClient();

  // Fast path: a lock-free read. Only when a daily deduction is actually due
  // do we fall through to sync_points (which takes a row lock + writes).
  const { data: fast } = await supabase
    .rpc("get_entitlements_fast")
    .single<{
      points: number;
      lifetime: boolean;
      plan: string;
      role: string;
      needs_deduction: boolean;
    }>();

  if (fast && !fast.needs_deduction) {
    return toEntitlements(fast);
  }

  // Deduction due (or the fast RPC is unavailable pre-migration): run the
  // full sync_points which deducts elapsed days and returns fresh values.
  const { data, error } = await supabase.rpc("sync_points").single<{
    points: number;
    lifetime: boolean;
    plan: string;
    role: string;
  }>();

  if (error || !data) return FREE;
  return toEntitlements(data);
});
