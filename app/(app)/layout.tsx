import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { FreeBanner } from "@/components/free-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PointsPill } from "@/components/points-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getEntitlements } from "@/lib/entitlements";
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

  const [entitlements, { data: profile }] = await Promise.all([
    getEntitlements(),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const userName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          userName={userName}
          userEmail={user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          isSuperAdmin={entitlements.isSuperAdmin}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-2">
              <PointsPill
                points={entitlements.points}
                lifetime={entitlements.lifetime}
              />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {!entitlements.isPremium && <FreeBanner />}
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
