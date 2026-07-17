import Link from "next/link";
import { ChevronRight, Languages, Palette, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const t = await getDict();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.settings}</h1>
        <p className="text-sm text-muted-foreground">
          {t.misc.settingsSubtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.nav.profile}</CardTitle>
          <CardDescription>{t.profile.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/profile"
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <UserRound className="size-4" /> {t.nav.profile}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.misc.language}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Languages className="size-4" /> English / नेपाली — use the
            switcher in the top bar.
          </p>
          <p className="flex items-center gap-2">
            <Palette className="size-4" /> Light / Dark — use the theme toggle
            in the top bar.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
