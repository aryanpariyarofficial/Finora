"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import {
  completeOnboarding,
  setDisplayPreferences,
} from "@/lib/actions/onboarding";
import { setAccountBalance } from "@/lib/actions/accounts";
import { saveTransaction } from "@/lib/actions/transactions";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayISO } from "@/lib/finance";
import type { AccountBalance } from "@/lib/types";

export function OnboardingDialog({
  accounts,
  expenseCategories,
  initialLocale,
  initialCalendar,
}: {
  accounts: AccountBalance[];
  expenseCategories: AccountBalance[];
  initialLocale: string;
  initialCalendar: string;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  const [locale, setLocale] = useState(initialLocale);
  const [calendar, setCalendar] = useState(initialCalendar);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  const TOTAL = 4;

  function finish() {
    startTransition(async () => {
      // 1. Save any balances entered.
      for (const acc of accounts) {
        const raw = balances[acc.id];
        const value = raw ? Number(raw) : NaN;
        if (Number.isFinite(value) && value > 0) {
          await setAccountBalance(acc.id, value);
        }
      }

      // 2. Save the first expense if provided.
      const amt = Number(expenseAmount);
      if (Number.isFinite(amt) && amt > 0 && expenseCategory) {
        const fd = new FormData();
        fd.set("type", "expense");
        fd.set("amount", String(amt));
        fd.set("occurred_on", todayISO());
        fd.set("account_id", accounts[0]?.id ?? "");
        fd.set("category_id", expenseCategory);
        await saveTransaction(null, fd);
      }

      await completeOnboarding();
      toast.success(t.onboard.saved);
      setOpen(false);
      router.refresh();
    });
  }

  async function goNextFromPrefs() {
    // Persist language/calendar immediately so the rest of the flow reflects it.
    await setDisplayPreferences(locale, calendar);
    router.refresh();
    setStep(2);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-md [&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle>
            {step === 1 && t.onboard.welcomeTitle}
            {step === 2 && t.onboard.balanceTitle}
            {step === 3 && t.onboard.firstTxTitle}
            {step === 4 && t.onboard.doneTitle}
          </DialogTitle>
        </DialogHeader>

        {/* progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 <= step ? "bg-[oklch(0.63_0.21_355)]" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — preferences */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.onboard.welcomeBody}
            </p>
            <div className="space-y-2">
              <Label>{t.onboard.prefsLang}</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ne">नेपाली</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.onboard.prefsCalendar}</Label>
              <Select value={calendar} onValueChange={setCalendar}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ad">{t.profile.calendarAd}</SelectItem>
                  <SelectItem value="bs">{t.profile.calendarBs}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={goNextFromPrefs}>
              {t.onboard.next} <ArrowRight />
            </Button>
          </div>
        )}

        {/* Step 2 — balances */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.onboard.balanceBody}
            </p>
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center gap-3">
                  <Label className="w-24 shrink-0">{acc.name}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="0"
                    value={balances[acc.id] ?? ""}
                    onChange={(e) =>
                      setBalances((b) => ({ ...b, [acc.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft /> {t.onboard.back}
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                {t.onboard.next} <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — first expense */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.onboard.firstTxBody}
            </p>
            <div className="space-y-2">
              <Label>{t.onboard.firstTxAmount}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="250"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.onboard.firstTxCategory}</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.tx.chooseCategory} />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft /> {t.onboard.back}
              </Button>
              <Button className="flex-1" onClick={() => setStep(4)}>
                {t.onboard.next} <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — done */}
        {step === 4 && (
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--success)]/15">
              <PartyPopper className="size-7 text-[var(--success)]" />
            </div>
            <p className="text-sm text-muted-foreground">{t.onboard.doneBody}</p>
            <Button className="w-full" disabled={pending} onClick={finish}>
              {pending ? "…" : <>{t.onboard.finish} <Check /></>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
