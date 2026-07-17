import Link from "next/link";
import { ArrowRight, ChartPie, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Wallet,
    title: "Income & Expenses",
    body: "Log every rupee across cash, banks, eSewa and Khalti.",
  },
  {
    icon: ChartPie,
    title: "Budgets & Reports",
    body: "Category budgets with live progress and monthly reports.",
  },
  {
    icon: Landmark,
    title: "Loans & EMI",
    body: "Amortization schedules, interest tracking and due dates.",
  },
  {
    icon: TrendingUp,
    title: "Investments",
    body: "FD, shares, gold and crypto with ROI at a glance.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Your personal financial{" "}
          <span className="text-[oklch(0.63_0.21_355)]">command center</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Track income, expenses, budgets, loans and investments — built on a
          double-entry core so your numbers always add up.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/signup">
            Start free <ArrowRight />
          </Link>
        </Button>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 text-left shadow-xs"
            >
              <f.icon className="size-5 text-[oklch(0.63_0.21_355)]" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Finora — Your Personal Financial Command Center
      </footer>
    </main>
  );
}
