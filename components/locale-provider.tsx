"use client";

import { createContext, useContext } from "react";
import { en, type Dict, type Locale } from "@/lib/i18n/dictionaries";
import { formatAppDate, type CalendarPref } from "@/lib/calendar";

const LocaleContext = createContext<{
  dict: Dict;
  locale: Locale;
  calendar: CalendarPref;
}>({
  dict: en,
  locale: "en",
  calendar: "ad",
});

export function LocaleProvider({
  dict,
  locale,
  calendar,
  children,
}: {
  dict: Dict;
  locale: Locale;
  calendar: CalendarPref;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ dict, locale, calendar }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Client-side dictionary access: `const t = useT(); t.nav.dashboard` */
export function useT(): Dict {
  return useContext(LocaleContext).dict;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useCalendar(): CalendarPref {
  return useContext(LocaleContext).calendar;
}

/** Calendar-aware date formatter for client components. */
export function useFormatDate() {
  const { calendar, locale } = useContext(LocaleContext);
  return (iso: string) => formatAppDate(iso, calendar, locale);
}
