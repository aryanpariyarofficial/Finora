"use client";

import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/dictionaries";

const LANGS: { value: Locale; short: string; label: string }[] = [
  { value: "en", short: "EN", label: "English" },
  { value: "ne", short: "ने", label: "नेपाली" },
];

function persistLocale(value: Locale) {
  document.cookie = `finora-locale=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  function setLocale(value: Locale) {
    persistLocale(value);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className="gap-3"
          >
            <span className="w-5 text-xs font-semibold text-muted-foreground">
              {lang.short}
            </span>
            <span className="flex-1">{lang.label}</span>
            {locale === lang.value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
