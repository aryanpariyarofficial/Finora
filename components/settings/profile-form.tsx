"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";
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

export function ProfileForm({
  fullName,
  email,
  currency,
}: {
  fullName: string;
  email: string;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, null);

  useEffect(() => {
    if (state?.success) toast.success("Profile updated");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
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
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
