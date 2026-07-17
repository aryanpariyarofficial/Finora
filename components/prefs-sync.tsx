"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * On a fresh device the cookies won't match the profile's saved defaults —
 * this syncs them once (profile is the source of truth for defaults).
 */
export function PrefsSync({
  profileLocale,
  profileCalendar,
  cookieLocale,
  cookieCalendar,
  hasCookies,
}: {
  profileLocale: string;
  profileCalendar: string;
  cookieLocale: string;
  cookieCalendar: string;
  hasCookies: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    // Only seed defaults when no explicit cookie choice exists yet.
    if (hasCookies) return;
    if (profileLocale === cookieLocale && profileCalendar === cookieCalendar) {
      return;
    }
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `finora-locale=${profileLocale}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `finora-calendar=${profileCalendar}; path=/; max-age=${maxAge}; samesite=lax`;
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
