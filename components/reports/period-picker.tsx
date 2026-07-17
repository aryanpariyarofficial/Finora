"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/locale-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PeriodPicker() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      value={searchParams.get("period") ?? "this_month"}
      onValueChange={(v) => router.push(`/reports?period=${v}`)}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="this_month">{t.reports.thisMonth}</SelectItem>
        <SelectItem value="last_month">{t.reports.lastMonth}</SelectItem>
        <SelectItem value="3m">{t.reports.m3}</SelectItem>
        <SelectItem value="6m">{t.reports.m6}</SelectItem>
        <SelectItem value="12m">{t.reports.m12}</SelectItem>
      </SelectContent>
    </Select>
  );
}
