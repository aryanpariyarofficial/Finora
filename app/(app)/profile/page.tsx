import { redirect } from "next/navigation";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ReferralCard } from "@/components/profile/referral-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntitlements } from "@/lib/entitlements";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, ent, { data: profile }, { count: referralCount }] =
    await Promise.all([
      getDict(),
      getEntitlements(),
      supabase
        .from("profiles")
        .select(
          "full_name, avatar_url, currency, bio, phone, locale, calendar, referral_code",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", user.id),
    ]);

  const name = profile?.full_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            name={name}
          />
          <ProfileDetailsForm
            fullName={profile?.full_name ?? ""}
            email={user.email ?? ""}
            currency={profile?.currency ?? "NPR"}
            bio={profile?.bio ?? ""}
            phone={profile?.phone ?? ""}
            locale={profile?.locale ?? "en"}
            calendar={profile?.calendar ?? "ad"}
          />
        </CardContent>
      </Card>

      <ReferralCard
        code={profile?.referral_code ?? null}
        referralCount={referralCount ?? 0}
        isPremium={ent.isPremium}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.changePassword}</CardTitle>
          <CardDescription>{t.profile.passwordTooShort}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
