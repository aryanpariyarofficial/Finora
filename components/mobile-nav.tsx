"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ChartColumnBig,
  LayoutDashboard,
  PiggyBank,
  Plus,
} from "lucide-react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AccountBalance } from "@/lib/types";

export function MobileNav({
  accounts,
  incomeCategories,
  expenseCategories,
  allowTransfer,
}: {
  accounts: AccountBalance[];
  incomeCategories: AccountBalance[];
  expenseCategories: AccountBalance[];
  allowTransfer: boolean;
}) {
  const pathname = usePathname();
  const t = useT();

  const items = [
    { title: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { title: t.nav.transactions, href: "/transactions", icon: ArrowLeftRight },
    null, // FAB slot
    { title: t.nav.budgets, href: "/budgets", icon: PiggyBank },
    { title: t.nav.reports, href: "/reports", icon: ChartColumnBig },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16 grid-cols-5 items-center">
        {items.map((item, i) =>
          item ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium",
                pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="max-w-16 truncate">{item.title}</span>
            </Link>
          ) : (
            <div key={i} className="flex items-center justify-center">
              <TransactionForm
                accounts={accounts}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
                allowTransfer={allowTransfer}
                trigger={
                  <Button
                    size="icon"
                    aria-label={t.tx.add}
                    className="-mt-6 size-14 rounded-full bg-[oklch(0.63_0.21_355)] text-white shadow-lg hover:bg-[oklch(0.58_0.21_355)]"
                  >
                    <Plus className="size-6" />
                  </Button>
                }
              />
            </div>
          ),
        )}
      </div>
    </nav>
  );
}
