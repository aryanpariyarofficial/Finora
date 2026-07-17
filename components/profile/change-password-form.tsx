"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ChangePasswordForm() {
  const t = useT();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("new_password") ?? "");
    const confirm = String(formData.get("confirm_password") ?? "");

    if (password.length < 8) {
      toast.error(t.profile.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      toast.error(t.profile.passwordMismatch);
      return;
    }

    setPending(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) toast.error(error.message);
    else {
      toast.success(t.profile.passwordChanged);
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_password">{t.profile.newPassword}</Label>
        <PasswordInput
          id="new_password"
          name="new_password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">{t.profile.confirmPassword}</Label>
        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? t.profile.saving : t.profile.changePassword}
      </Button>
    </form>
  );
}
