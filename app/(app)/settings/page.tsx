import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, currency")
    .eq("id", user.id)
    .single();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your name and default currency. Theme follows the toggle in the top
            bar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            email={user.email ?? ""}
            currency={profile?.currency ?? "NPR"}
          />
        </CardContent>
      </Card>
    </>
  );
}
