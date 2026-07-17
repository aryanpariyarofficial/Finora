"use client";

import { useState } from "react";
import { useCalendar, useLocale } from "@/components/locale-provider";
import {
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  adISOtoBS,
  bsDaysInMonth,
  bsToADISO,
  currentBSYear,
  toNepaliDigits,
} from "@/lib/calendar";
import { todayISO } from "@/lib/finance";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Date input that respects the user's calendar preference.
 * - AD: native <input type="date">
 * - BS: three dropdowns (year / month / day) in Bikram Sambat; the submitted
 *   form value is always the AD ISO date, so storage stays AD.
 */
export function DateField({
  id,
  name,
  defaultValue,
  required,
  optional,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  /** Allow an empty value (e.g. optional maturity date). */
  optional?: boolean;
}) {
  const calendar = useCalendar();
  const locale = useLocale();

  if (calendar !== "bs") {
    return (
      <Input
        id={id}
        name={name}
        type="date"
        required={required}
        defaultValue={optional ? (defaultValue ?? "") : (defaultValue ?? todayISO())}
      />
    );
  }

  if (optional && !defaultValue) {
    return <OptionalBSDatePicker id={id} name={name} locale={locale} />;
  }

  return (
    <BSDatePicker
      id={id}
      name={name}
      defaultValue={defaultValue ?? todayISO()}
      required={required}
      locale={locale}
    />
  );
}

/** BS picker that starts empty; a button reveals the selects when needed. */
function OptionalBSDatePicker({
  id,
  name,
  locale,
}: {
  id?: string;
  name: string;
  locale: string;
}) {
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <>
        <input type="hidden" name={name} value="" />
        <button
          type="button"
          id={id}
          onClick={() => setEnabled(true)}
          className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground hover:bg-accent"
        >
          {locale === "ne" ? "मिति थप्नुहोस्" : "Add date"}
        </button>
      </>
    );
  }

  return (
    <BSDatePicker id={id} name={name} defaultValue={todayISO()} locale={locale} />
  );
}

function BSDatePicker({
  id,
  name,
  defaultValue,
  required,
  locale,
}: {
  id?: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  locale: string;
}) {
  const initial = adISOtoBS(defaultValue);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const months = locale === "ne" ? BS_MONTHS_NE : BS_MONTHS_EN;
  const maxDay = bsDaysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  const iso = bsToADISO(year, month, safeDay);

  const thisYear = currentBSYear();
  const years: number[] = [];
  for (let y = thisYear + 1; y >= 2070; y--) years.push(y);

  const fmt = (n: number) =>
    locale === "ne" ? toNepaliDigits(n) : String(n);

  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={iso} required={required} />
      {/* Year — widest */}
      <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
        <SelectTrigger id={id} className="flex-[1.2] min-w-[4.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {fmt(y)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Month */}
      <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
        <SelectTrigger className="flex-[1.6] min-w-[5.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((label, i) => (
            <SelectItem key={i} value={String(i)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Day */}
      <Select value={String(safeDay)} onValueChange={(v) => setDay(Number(v))}>
        <SelectTrigger className="flex-1 min-w-[3.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>
              {fmt(d)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
