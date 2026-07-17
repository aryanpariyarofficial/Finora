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
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LogoMark } from "@/components/logo";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Accounts", href: "/accounts", icon: Wallet },
  { title: "Budgets", href: "/budgets", icon: PiggyBank },
];

const growNav = [
  { title: "Loans", href: "/loans", icon: Landmark },
  { title: "Investments", href: "/investments", icon: TrendingUp },
  { title: "Reports", href: "/reports", icon: ChartColumnBig },
];

export function AppSidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

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
          <SidebarGroupLabel>Money</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Grow</SidebarGroupLabel>
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
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:px-0">
              <Avatar className="size-7">
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
              <form action={logout} className="group-data-[collapsible=icon]:hidden">
                <button
                  type="submit"
                  aria-label="Log out"
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
