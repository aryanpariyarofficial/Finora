"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitPaymentRequest } from "@/lib/actions/billing";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PaymentRequestForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitPaymentRequest(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t.upgrade.submitted);
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <Card id="verify">
      <CardHeader>
        <CardTitle>{t.upgrade.formTitle}</CardTitle>
        <CardDescription>{t.upgrade.formSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t.upgrade.fullName}</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              defaultValue={defaultName}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t.upgrade.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaultEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.upgrade.phone}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={defaultPhone}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.upgrade.plan}</Label>
            <Select name="plan" defaultValue="monthly" required>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t.upgrade.monthly}</SelectItem>
                <SelectItem value="half_yearly">
                  {t.upgrade.half_yearly}
                </SelectItem>
                <SelectItem value="yearly">{t.upgrade.yearly}</SelectItem>
                <SelectItem value="lifetime">
                  {t.upgrade.lifetimePlan}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshot">{t.upgrade.screenshot}</Label>
            <Input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t.upgrade.submitting : t.upgrade.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
