"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { submitPaymentRequest } from "@/lib/actions/billing";
import { PLANS, type PlanId } from "@/lib/billing";
import { formatMoney } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const BANKS = [
  { id: "nepal_sbi", label: "Nepal SBI Bank", qr: "/qr-pay/nepal-sbi.png" },
  { id: "global_ime", label: "Global IME Bank", qr: "/qr-pay/global-ime.png" },
  {
    id: "laxmi_sunrise",
    label: "Laxmi Sunrise Bank",
    qr: "/qr-pay/laxmi-sunrise.png",
  },
] as const;

type WalletMethod = "esewa" | "khalti" | "bank";

interface Defaults {
  name: string;
  email: string;
  phone: string;
}

export function PlansSection({
  currentPlan,
  isPremium,
  defaults,
}: {
  currentPlan: string;
  isPremium: boolean;
  defaults: Defaults;
}) {
  const t = useT();
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);

  const planLabel: Record<string, string> = {
    monthly: t.upgrade.monthly,
    half_yearly: t.upgrade.half_yearly,
    yearly: t.upgrade.yearly,
    lifetime: t.upgrade.lifetimePlan,
    free: t.upgrade.free,
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* Free plan */}
        <Card
          className={cn(
            "flex flex-col",
            currentPlan === "free" && !isPremium && "border-primary ring-1 ring-primary",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.upgrade.free}</CardTitle>
              {currentPlan === "free" && !isPremium && (
                <Badge variant="secondary">{t.upgrade.currentBadge}</Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{formatMoney(0)}</p>
            <p className="text-sm text-muted-foreground">&nbsp;</p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-1.5 text-sm">
              {t.upgrade.freeIncluded.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentPlan === "free" && !isPremium
                ? t.upgrade.ctaFree
                : t.upgrade.free}
            </Button>
          </CardFooter>
        </Card>

        {/* Paid plans */}
        {PLANS.map((plan) => {
          const isCurrent = isPremium && currentPlan === plan.id;
          const perDay =
            plan.price != null && plan.days != null
              ? Math.round(plan.price / plan.days)
              : null;
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col",
                plan.popular && "border-[oklch(0.63_0.21_355)] shadow-md",
                isCurrent && "border-primary ring-1 ring-primary",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{planLabel[plan.id]}</CardTitle>
                  {isCurrent ? (
                    <Badge variant="secondary">{t.upgrade.currentBadge}</Badge>
                  ) : (
                    plan.popular && (
                      <Badge className="bg-[oklch(0.63_0.21_355)] text-white">
                        {t.upgrade.popular}
                      </Badge>
                    )
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {plan.price != null ? formatMoney(plan.price) : "—"}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {plan.points != null ? (
                    <>
                      {perDay != null && (
                        <span className="font-medium text-foreground">
                          ≈ {formatMoney(perDay)} {t.upgrade.perDay}
                        </span>
                      )}
                      · {plan.days} {t.upgrade.daysLeft}
                    </>
                  ) : (
                    <>
                      <InfinityIcon className="size-4" /> {t.upgrade.unlimited}
                    </>
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-1.5 text-sm">
                  {t.upgrade.premiumIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    "w-full",
                    plan.popular &&
                      "bg-[oklch(0.63_0.21_355)] text-white hover:bg-[oklch(0.58_0.21_355)]",
                  )}
                  onClick={() => setCheckoutPlan(plan.id)}
                >
                  <Sparkles className="size-4" />
                  {plan.id === "lifetime"
                    ? t.upgrade.ctaLifetime
                    : t.upgrade.ctaRecurring}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <CheckoutDialog
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        defaults={defaults}
      />
    </>
  );
}

function CheckoutDialog({
  plan,
  onClose,
  defaults,
}: {
  plan: PlanId | null;
  onClose: () => void;
  defaults: Defaults;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [method, setMethod] = useState<WalletMethod>("esewa");
  const [bank, setBank] = useState<(typeof BANKS)[number]["id"]>("nepal_sbi");

  // Sync the preselected plan when a card button opens the dialog.
  const [lastOpened, setLastOpened] = useState<PlanId | null>(null);
  if (plan && plan !== lastOpened) {
    setLastOpened(plan);
    setSelectedPlan(plan);
  }

  const planLabel: Record<PlanId, string> = {
    monthly: t.upgrade.monthly,
    half_yearly: t.upgrade.half_yearly,
    yearly: t.upgrade.yearly,
    lifetime: t.upgrade.lifetimePlan,
  };

  const activePlan = PLANS.find((p) => p.id === selectedPlan);
  const payMethod = method === "bank" ? bank : method;
  const qrSrc =
    method === "esewa"
      ? "/qr-pay/esewa.png"
      : method === "khalti"
        ? "/qr-pay/khalti.png"
        : BANKS.find((b) => b.id === bank)!.qr;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("plan", selectedPlan);
    formData.set("pay_method", payMethod);
    startTransition(async () => {
      const result = await submitPaymentRequest(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t.upgrade.submitted);
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t.upgrade.formTitle}
            {activePlan?.price != null && (
              <span className="ml-2 text-muted-foreground">
                · {formatMoney(activePlan.price)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.upgrade.plan}</Label>
            <Select
              value={selectedPlan}
              onValueChange={(v) => setSelectedPlan(v as PlanId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {planLabel[p.id]}
                    {p.price != null ? ` — ${formatMoney(p.price)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.upgrade.payVia}</Label>
            <Tabs
              value={method}
              onValueChange={(v) => setMethod(v as WalletMethod)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="esewa" className="flex-1">
                  eSewa
                </TabsTrigger>
                <TabsTrigger value="khalti" className="flex-1">
                  Khalti
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1">
                  Bank
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {method === "bank" && (
              <Select
                value={bank}
                onValueChange={(v) => setBank(v as typeof bank)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.upgrade.chooseBank} />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-xl border bg-white p-3">
            <Image
              src={qrSrc}
              alt="Payment QR code"
              width={480}
              height={480}
              className="mx-auto size-56 object-contain"
            />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {t.upgrade.scanToPay}
              {activePlan?.price != null && (
                <>
                  {" · "}
                  <span className="font-semibold text-foreground">
                    {t.upgrade.amountToPay}: {formatMoney(activePlan.price)}
                  </span>
                </>
              )}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">{t.upgrade.afterPay}</p>

          <div className="space-y-2">
            <Label htmlFor="co_full_name">{t.upgrade.fullName}</Label>
            <Input
              id="co_full_name"
              name="full_name"
              required
              defaultValue={defaults.name}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="co_email">{t.upgrade.email}</Label>
              <Input
                id="co_email"
                name="email"
                type="email"
                required
                defaultValue={defaults.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co_phone">{t.upgrade.phone}</Label>
              <Input
                id="co_phone"
                name="phone"
                type="tel"
                required
                defaultValue={defaults.phone}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co_screenshot">{t.upgrade.screenshot}</Label>
            <Input
              id="co_screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.upgrade.submitting : t.upgrade.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
