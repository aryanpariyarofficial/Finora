import { redirect } from "next/navigation";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, { data: profile }] = await Promise.all([
    getDict(),
    supabase
      .from("profiles")
      .select("full_name, avatar_url, currency, bio, phone")
      .eq("id", user.id)
      .single(),
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
          />
        </CardContent>
      </Card>
    </>
  );
}
