"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const chartFallback = () => <Skeleton className="h-80 rounded-xl" />;

/**
 * Recharts is ~112 KB gzipped — defer it so the dashboard's stat cards and
 * recent transactions paint first, and the charts hydrate after. Big win on
 * low-end phones where the default post-login route is the dashboard.
 */
export const CashflowChart = dynamic(
  () => import("./cashflow-chart").then((m) => m.CashflowChart),
  { ssr: false, loading: chartFallback },
);

export const CategoryDonut = dynamic(
  () => import("./category-donut").then((m) => m.CategoryDonut),
  { ssr: false, loading: chartFallback },
);

export const SavingsTrend = dynamic(
  () => import("../reports/savings-trend").then((m) => m.SavingsTrend),
  { ssr: false, loading: chartFallback },
);
