"use client";

import Link from "next/link";
import { Suspense, useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Gift } from "lucide-react";
import { signup } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";

function SignupForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [state, formAction, pending] = useActionState(signup, null);

  // Persist the referral code for the Google OAuth path too.
  useEffect(() => {
    if (ref) {
      document.cookie = `finora-ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    }
  }, [ref]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Free forever for personal use. No card required.
        </CardDescription>
        {ref && (
          <p className="flex items-center gap-1.5 rounded-md bg-[oklch(0.63_0.21_355)]/10 px-3 py-2 text-xs font-medium text-[oklch(0.55_0.21_355)]">
            <Gift className="size-3.5" />
            Referral applied — you&apos;ll get 1 month of premium free!
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="ref" value={ref} />
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              required
              placeholder="Aryan Sharma"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="At least 8 characters"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-[oklch(0.6_0.14_160)]">
              {state.success}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
