import { cookies } from "next/headers";
import { dictionaries, type Dict, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "finora-locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "ne" ? "ne" : "en";
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
