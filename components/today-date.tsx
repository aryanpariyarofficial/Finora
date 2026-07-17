"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import { useCalendar, useLocale } from "@/components/locale-provider";
import { formatToday } from "@/lib/calendar";

const noop = () => () => {};

export function TodayDate() {
  const calendar = useCalendar();
  const locale = useLocale();
  // Avoid hydration mismatch: render only on the client.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return (
    <span className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
      <CalendarDays className="size-4" />
      {formatToday(calendar, locale)}
    </span>
  );
}
