"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ProfileDetailsForm({
  fullName,
  email,
  currency,
  bio,
  phone,
}: {
  fullName: string;
  email: string;
  currency: string;
  bio: string;
  phone: string;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(null, formData);
      if (result?.error) toast.error(result.error);
      else toast.success(t.profile.saved);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">{t.profile.fullName}</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>
      <div className="space-y-2">
        <Label>{t.profile.email}</Label>
        <Input value={email} disabled />
        <p className="text-xs text-muted-foreground">{t.profile.emailLocked}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t.profile.phone}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="98XXXXXXXX"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">{t.profile.bio}</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={bio}
          placeholder={t.profile.bioPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select name="currency" defaultValue={currency}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NPR">NPR — Nepali Rupee</SelectItem>
            <SelectItem value="USD">USD — US Dollar</SelectItem>
            <SelectItem value="INR">INR — Indian Rupee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.profile.saving : t.profile.save}
      </Button>
    </form>
  );
}
