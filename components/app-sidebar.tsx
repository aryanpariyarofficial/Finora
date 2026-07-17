"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ChartColumnBig,
  LayoutDashboard,
  Landmark,
  LogOut,
  PiggyBank,
  Repeat,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LogoMark } from "@/components/logo";
import { useT } from "@/components/locale-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar({
  userName,
  userEmail,
  avatarUrl,
  isSuperAdmin,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const t = useT();

  const mainNav = [
    { title: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { title: t.nav.transactions, href: "/transactions", icon: ArrowLeftRight },
    { title: t.nav.accounts, href: "/accounts", icon: Wallet },
    { title: t.nav.budgets, href: "/budgets", icon: PiggyBank },
  ];

  const growNav = [
    { title: t.nav.loans, href: "/loans", icon: Landmark },
    { title: t.nav.investments, href: "/investments", icon: TrendingUp },
    { title: t.nav.recurring, href: "/recurring", icon: Repeat },
    { title: t.nav.goals, href: "/goals", icon: Target },
    { title: t.nav.reports, href: "/reports", icon: ChartColumnBig },
  ];

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname.startsWith(item.href)}
          tooltip={item.title}
        >
          <Link href={item.href}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-1">
          <LogoMark className="size-7 shrink-0" />
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Finora
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.money}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.grow}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(growNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/upgrade")}
              tooltip={t.nav.upgrade}
            >
              <Link href="/upgrade">
                <Sparkles className="text-[oklch(0.63_0.21_355)]" />
                <span>{t.nav.upgrade}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin")}
                tooltip={t.nav.admin}
              >
                <Link href="/admin">
                  <ShieldCheck />
                  <span>{t.nav.admin}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip={t.nav.settings}
            >
              <Link href="/settings">
                <Settings />
                <span>{t.nav.settings}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:px-0">
              <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2">
                <Avatar className="size-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
                  <AvatarFallback className="text-xs">
                    {userName.slice(0, 1).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </Link>
              <form action={logout} className="group-data-[collapsible=icon]:hidden">
                <button
                  type="submit"
                  aria-label={t.nav.logout}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
