import NepaliDate from "nepali-date-converter";
import type { Locale } from "@/lib/i18n/dictionaries";

export type CalendarPref = "ad" | "bs";

/**
 * Formats an ISO date (YYYY-MM-DD) in the user's calendar.
 * AD  → "17 Jul 2026" (en) / "१७ जुलाई २०२६"-style native (ne uses en-GB too)
 * BS  → "1 Shrawan 2083" (en) / "१ श्रावण २०८३" (ne)
 * Falls back to AD if the date is outside the BS conversion range.
 */
export function formatAppDate(
  iso: string,
  calendar: CalendarPref = "ad",
  locale: Locale = "en",
): string {
  const date = new Date(`${iso}T00:00:00`);

  if (calendar === "bs") {
    try {
      const nd = new NepaliDate(date);
      return locale === "ne"
        ? nd.format("DD MMMM YYYY", "np")
        : nd.format("DD MMMM YYYY");
    } catch {
      // out of supported BS range — fall through to AD
    }
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Today's date in the user's calendar, for the app header. */
export function formatToday(calendar: CalendarPref, locale: Locale): string {
  const now = new Date();

  if (calendar === "bs") {
    try {
      const nd = new NepaliDate(now);
      return locale === "ne"
        ? nd.format("ddd, DD MMMM YYYY", "np")
        : nd.format("ddd, DD MMMM YYYY");
    } catch {
      // fall through
    }
  }

  return now.toLocaleDateString(locale === "ne" ? "ne-NP" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
