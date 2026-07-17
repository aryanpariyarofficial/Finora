import { cookies } from "next/headers";
import { dictionaries, type Dict, type Locale } from "./dictionaries";
import type { CalendarPref } from "@/lib/calendar";

export const LOCALE_COOKIE = "finora-locale";
export const CALENDAR_COOKIE = "finora-calendar";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "ne" ? "ne" : "en";
}

export async function getCalendar(): Promise<CalendarPref> {
  const store = await cookies();
  const value = store.get(CALENDAR_COOKIE)?.value;
  return value === "bs" ? "bs" : "ad";
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
