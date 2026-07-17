"use client";

import { createContext, useContext } from "react";
import { en, type Dict, type Locale } from "@/lib/i18n/dictionaries";

const LocaleContext = createContext<{ dict: Dict; locale: Locale }>({
  dict: en,
  locale: "en",
});

export function LocaleProvider({
  dict,
  locale,
  children,
}: {
  dict: Dict;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ dict, locale }}>
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
