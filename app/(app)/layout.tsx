import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppLock } from "@/components/app-lock";
import { AppSidebar } from "@/components/app-sidebar";
import { FreeBanner } from "@/components/free-banner";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PointsPill } from "@/components/points-pill";
import { PrefsSync } from "@/components/prefs-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodayDate } from "@/components/today-date";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAccounts } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements";
import { CALENDAR_COOKIE, LOCALE_COOKIE } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const [entitlements, { data: profile }, accounts, { data: notifications }] =
    await Promise.all([
      getEntitlements(),
      supabase
        .from("profiles")
        .select("full_name, avatar_url, locale, calendar")
        .eq("id", user.id)
        .single(),
      getAccounts(),
      supabase
        .from("notifications")
        .select("id, title, body, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  // Admin switched this account off — end the session rather than render the
  // app. The auth-level ban stops token refresh; this closes the gap while an
  // already-issued access token is still valid.
  if (entitlements.deactivated) {
    await supabase.auth.signOut();
    redirect("/login?deactivated=1");
  }

  const unreadCount = (notifications ?? []).filter(
    (n) => n.read_at == null,
  ).length;

  const moneyAccounts = accounts.filter(
    (a) => a.kind === "asset" || a.kind === "liability",
  );

  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const calendarCookie = cookieStore.get(CALENDAR_COOKIE)?.value;

  const userName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  return (
    <TooltipProvider>
      <AppLock>
      <SidebarProvider>
        <AppSidebar
          userName={userName}
          userEmail={user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          isSuperAdmin={entitlements.isSuperAdmin}
        />
        <SidebarInset>
          <PrefsSync
            profileLocale={profile?.locale ?? "en"}
            profileCalendar={profile?.calendar ?? "ad"}
            cookieLocale={localeCookie ?? "en"}
            cookieCalendar={calendarCookie ?? "ad"}
            hasCookies={localeCookie != null || calendarCookie != null}
          />
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <TodayDate />
            <div className="ml-auto flex items-center gap-2">
              <PointsPill
                points={entitlements.points}
                lifetime={entitlements.lifetime}
              />
              <NotificationBell
                notifications={notifications ?? []}
                unreadCount={unreadCount}
              />
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href="/profile" aria-label="Profile" className="ml-1">
                <Avatar className="size-8 ring-2 ring-[oklch(0.63_0.21_355)]/40 ring-offset-2 ring-offset-background transition-transform hover:scale-105">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={userName} />
                  )}
                  <AvatarFallback className="bg-[oklch(0.63_0.21_355)]/15 text-xs font-medium text-[oklch(0.55_0.21_355)]">
                    {userName.slice(0, 1).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 pb-28 md:p-6 md:pb-6">
            {!entitlements.isPremium && <FreeBanner />}
            {children}
          </div>
          <MobileNav
            accounts={moneyAccounts}
            incomeCategories={accounts.filter((a) => a.kind === "income")}
            expenseCategories={accounts.filter((a) => a.kind === "expense")}
            allowTransfer={entitlements.isPremium}
          />
        </SidebarInset>
      </SidebarProvider>
      </AppLock>
    </TooltipProvider>
  );
}
