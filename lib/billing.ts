export type PlanId = "monthly" | "half_yearly" | "yearly" | "lifetime";

export interface Plan {
  id: PlanId;
  points: number | null; // null = lifetime/unlimited
  days: number | null;
  /** Price in NPR. */
  price: number | null;
  popular?: boolean;
}

/** 1 point = 1 day of premium access. */
export const PLANS: Plan[] = [
  { id: "monthly", points: 30, days: 30, price: 500 },
  { id: "half_yearly", points: 180, days: 180, price: 2000, popular: true },
  { id: "yearly", points: 365, days: 365, price: 3000 },
  { id: "lifetime", points: null, days: null, price: 10000 },
];

export const PLAN_POINTS: Record<Exclude<PlanId, "lifetime">, number> = {
  monthly: 30,
  half_yearly: 180,
  yearly: 365,
};

export interface Entitlements {
  points: number;
  lifetime: boolean;
  plan: string;
  role: string;
  isPremium: boolean;
  isSuperAdmin: boolean;
  /** Admin switched the account off — the app layout signs them out. */
  deactivated: boolean;
}

/** How many recent transactions a free user can see. */
export const FREE_TRANSACTION_LIMIT = 5;
