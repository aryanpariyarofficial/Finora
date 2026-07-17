import NepaliDate from "nepali-date-converter";
import type { Locale } from "@/lib/i18n/dictionaries";

export type CalendarPref = "ad" | "bs";

export const BS_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashar", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];
export const BS_MONTHS_NE = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन",
  "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Converts Latin digits in a string to Devanagari. */
export function toNepaliDigits(input: string | number): string {
  const map = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(input).replace(/\d/g, (d) => map[Number(d)]);
}

/** AD ISO (YYYY-MM-DD) → BS parts (month is 0-indexed). */
export function adISOtoBS(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  const bs = new NepaliDate(new Date(y, m - 1, d)).getBS();
  return { year: bs.year, month: bs.month, day: bs.date };
}

/** BS parts (month 0-indexed) → AD ISO (YYYY-MM-DD). TZ-independent. */
export function bsToADISO(year: number, month: number, day: number): string {
  const ad = new NepaliDate(year, month, day).getAD();
  return `${ad.year}-${pad(ad.month + 1)}-${pad(ad.date)}`;
}

/** Days in a given BS month (month 0-indexed). */
export function bsDaysInMonth(year: number, month: number): number {
  const firstAd = new NepaliDate(year, month, 1).getAD();
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextAd = new NepaliDate(nextYear, nextMonth, 1).getAD();
  const first = Date.UTC(firstAd.year, firstAd.month, firstAd.date);
  const next = Date.UTC(nextAd.year, nextAd.month, nextAd.date);
  return Math.round((next - first) / 86_400_000);
}

/** Current year in BS. */
export function currentBSYear(): number {
  return new NepaliDate(new Date()).getBS().year;
}

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
