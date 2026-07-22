import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  ChartPie,
  Check,
  FileSpreadsheet,
  Fuel,
  Landmark,
  Languages,
  Lock,
  PiggyBank,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing";
import { formatMoney } from "@/lib/finance";

const PINK = "text-[oklch(0.63_0.21_355)]";

/* ---------------------------------- Hero mockup ---------------------------------- */

const mockBars = [
  { m: "Feb", income: 55, expense: 38 },
  { m: "Mar", income: 62, expense: 45 },
  { m: "Apr", income: 58, expense: 52 },
  { m: "May", income: 74, expense: 48 },
  { m: "Jun", income: 70, expense: 41 },
  { m: "Jul", income: 88, expense: 44 },
];

const mockTxs = [
  { icon: Utensils, name: "Food · Bhatbhateni", amount: "-Rs. 2,450", tone: "text-destructive" },
  { icon: ArrowDownLeft, name: "Salary · NIC Asia", amount: "+Rs. 85,000", tone: "text-[var(--success)]" },
  { icon: Fuel, name: "Fuel · eSewa", amount: "-Rs. 3,000", tone: "text-destructive" },
  { icon: Wifi, name: "Internet · Khalti", amount: "-Rs. 1,300", tone: "text-destructive" },
];

function DashboardMockup() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border bg-card shadow-2xl">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#f57265]" />
        <span className="size-2.5 rounded-full bg-[#f5bf4f]" />
        <span className="size-2.5 rounded-full bg-[#5fc454]" />
        <span className="ml-3 flex-1 rounded-md bg-background px-3 py-1 text-left text-xs text-muted-foreground">
          finora.app/dashboard
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 text-left sm:p-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Current balance", value: "Rs. 8,52,000", icon: Wallet, tone: "" },
            { label: "Monthly income", value: "Rs. 95,000", icon: ArrowDownLeft, tone: "text-[var(--success)]" },
            { label: "Monthly expense", value: "Rs. 46,200", icon: ArrowUpRight, tone: "text-destructive" },
            { label: "Savings rate", value: "51%", icon: PiggyBank, tone: "text-[var(--success)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <s.icon className="size-3.5 text-muted-foreground" />
              </div>
              <p className={`mt-1 text-sm font-bold tabular-nums lg:text-base ${s.tone}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* bar chart */}
          <div className="rounded-lg border bg-background p-4 lg:col-span-3">
            <p className="text-xs font-semibold">Cash flow</p>
            <p className="text-[11px] text-muted-foreground">
              Income vs expense, last 6 months
            </p>
            <div className="mt-4 flex h-36 items-end justify-between gap-2">
              {mockBars.map((b) => (
                <div key={b.m} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-end justify-center gap-1" style={{ height: "120px" }}>
                    <div
                      className="w-3 rounded-t-[4px] bg-[var(--chart-4)] sm:w-4"
                      style={{ height: `${b.income}%` }}
                    />
                    <div
                      className="w-3 rounded-t-[4px] bg-[var(--chart-2)] sm:w-4"
                      style={{ height: `${b.expense}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{b.m}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-[var(--chart-4)]" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-[var(--chart-2)]" /> Expense
              </span>
            </div>
          </div>

          {/* donut + transactions */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
              <div
                className="size-20 shrink-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(var(--chart-1) 0 34%, var(--chart-2) 34% 58%, var(--chart-3) 58% 76%, var(--chart-4) 76% 90%, var(--chart-5) 90% 100%)",
                }}
              >
                <div className="m-[14px] size-[52px] rounded-full bg-background" />
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[var(--chart-1)]" /> Rent · 34%
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[var(--chart-2)]" /> Food · 24%
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[var(--chart-3)]" /> Fuel · 18%
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[var(--chart-4)]" /> Shopping · 14%
                </li>
              </ul>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="mb-2 text-xs font-semibold">Recent transactions</p>
              <ul className="space-y-2">
                {mockTxs.map((tx) => (
                  <li key={tx.name} className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-muted p-1.5">
                      <tx.icon className="size-3 text-muted-foreground" />
                    </span>
                    <span className="flex-1 truncate text-muted-foreground">{tx.name}</span>
                    <span className={`font-semibold tabular-nums ${tx.tone}`}>{tx.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Sections ---------------------------------- */

const features = [
  {
    icon: Wallet,
    title: "Income & Expenses",
    body: "Log every rupee across Cash, banks, eSewa and Khalti — with categories, remarks, receipts and location.",
  },
  {
    icon: ChartPie,
    title: "Budgets that talk back",
    body: "Set monthly limits per category and watch live progress bars warn you before you overspend.",
  },
  {
    icon: Landmark,
    title: "Loans & EMI",
    body: "Auto-calculated EMI, amortization schedules, and payments that split interest from principal for you.",
  },
  {
    icon: TrendingUp,
    title: "Investments",
    body: "FD, shares, crypto, gold and mutual funds — ROI, profit/loss and portfolio value at a glance.",
  },
  {
    icon: FileSpreadsheet,
    title: "Reports & Export",
    body: "Any period, category breakdowns, monthly trends — exported to Excel or PDF in one click.",
  },
  {
    icon: Scale,
    title: "Double-entry accurate",
    body: "Every transaction posts balanced debits and credits under the hood. Your balances can never drift.",
  },
];

const steps = [
  {
    n: "1",
    title: "Sign up free",
    body: "Email or Google — your Nepali chart of accounts (Cash, Bank, eSewa, Khalti) is ready instantly.",
  },
  {
    n: "2",
    title: "Track for 2 minutes a day",
    body: "Add income and expenses as they happen. Budgets and charts update in real time.",
  },
  {
    n: "3",
    title: "Watch your savings grow",
    body: "Spot the leaks, plan the EMIs, grow the investments — all from one dashboard.",
  },
];

const faqs = [
  {
    q: "Is Finora really free to start?",
    a: "Yes. The free plan lets you track income and expenses forever — no card, no trial timer. Premium unlocks full history, budgets, loans, investments and exports.",
  },
  {
    q: "How does the credit system work?",
    a: "1 credit = 1 day of premium. Monthly = 30 credits, 6 months = 180, yearly = 365, and Lifetime never runs out. Pay once via eSewa, Khalti or bank transfer — no auto-billing, no surprise charges.",
  },
  {
    q: "What happens to my data if my credits run out?",
    a: "Nothing is ever deleted. Your data simply waits in view-only mode and everything unlocks the moment you top up.",
  },
  {
    q: "Is my financial data safe?",
    a: "Your data lives in a Postgres database with row-level security — only your login can read your rows. Everything travels over HTTPS.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes — Finora is installable as an app. Open it in your browser, tap “Add to Home Screen”, and it works like a native app with the Finora icon.",
  },
  {
    q: "How does the referral program work?",
    a: "Premium members get a personal invite link. When a friend signs up through it, you BOTH receive 30 credits — a full month of premium, free. Your link lives on your Profile page.",
  },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://finoraypf.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Finora",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      description:
        "Personal finance app for Nepal — track income, expenses, budgets, loans and investments with NPR, eSewa, Khalti and Bikram Sambat support.",
      url: SITE_URL,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "NPR", name: "Free" },
        { "@type": "Offer", price: "500", priceCurrency: "NPR", name: "Monthly" },
        { "@type": "Offer", price: "2000", priceCurrency: "NPR", name: "6 Months" },
        { "@type": "Offer", price: "3000", priceCurrency: "NPR", name: "1 Year" },
        { "@type": "Offer", price: "10000", priceCurrency: "NPR", name: "Lifetime" },
      ],
    },
    {
      "@type": "Organization",
      name: "Finora",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
          style={{
            background:
              "radial-gradient(600px 260px at 50% 0%, oklch(0.63 0.21 355 / 0.12), transparent 70%)",
          }}
        />
        <Badge variant="secondary" className="mb-5 gap-1.5">
          🇳🇵 Made for Nepal — NPR, eSewa, Khalti & lakh/crore built in
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Your personal financial{" "}
          <span className={PINK}>command center</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Track income, expenses, budgets, loans and investments — built on a
          double-entry core so your numbers always add up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start free <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#pricing">See pricing</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free forever plan · No card required · English + नेपाली
        </p>

        <div className="mt-14">
          <DashboardMockup />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y bg-muted/40 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { big: "Rs. 0", small: "to get started" },
            { big: "2 min", small: "daily tracking habit" },
            { big: "5+", small: "payment channels supported" },
            { big: "100%", small: "balanced double-entry ledger" },
          ].map((s) => (
            <div key={s.small}>
              <p className={`text-2xl font-bold md:text-3xl ${PINK}`}>{s.big}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Referral strip */}
      <section className="px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 rounded-xl border border-[oklch(0.63_0.21_355)]/30 bg-[oklch(0.63_0.21_355)]/5 px-5 py-3 text-center text-sm">
          <span>🎁</span>
          <span>
            <b>Refer a friend, both get 1 month free.</b> Premium members get a
            personal invite link — every friend who joins earns you both 30
            days of premium.
          </span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything your money needs, in one place
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            From daily chiya expenses to multi-year loans — Finora keeps the
            full picture accurate, automatically.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="inline-flex rounded-lg bg-[oklch(0.63_0.21_355)]/10 p-2.5">
                <f.icon className={`size-5 ${PINK}`} />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Budget showcase */}
      <section className="border-y bg-muted/40 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-3">
              <PiggyBank className="size-3.5" /> Budgets
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Know you&apos;re overspending{" "}
              <span className={PINK}>before</span> it happens
            </h2>
            <p className="mt-3 text-muted-foreground">
              Set a limit for Food, Fuel or Shopping and Finora tracks every
              rupee against it in real time. Cross the line and the bar turns
              red — no month-end surprises.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "Per-category monthly limits",
                "Live progress with percentage",
                "Over-budget warnings",
              ].map((li) => (
                <li key={li} className="flex items-center gap-2">
                  <Check className="size-4 text-[var(--success)]" /> {li}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-5 shadow-lg">
            {[
              { name: "Food", spent: 18000, limit: 20000, pct: 90 },
              { name: "Fuel", spent: 5200, limit: 8000, pct: 65 },
              { name: "Shopping", spent: 16400, limit: 15000, pct: 100, over: true },
              { name: "Entertainment", spent: 2100, limit: 6000, pct: 35 },
            ].map((b) => (
              <div key={b.name} className="rounded-lg border bg-background p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {b.name}
                    {b.over && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">
                        Over budget
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(b.spent)} / {formatMoney(b.limit)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${b.over ? "bg-destructive" : "bg-[var(--chart-2)]"}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loans showcase */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
        <div className="order-2 rounded-xl border bg-card p-5 shadow-lg lg:order-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">Home Loan — NIC Asia</p>
              <p className="text-xs text-muted-foreground">
                Rs. 10,00,000 · 12% · 60 months
              </p>
            </div>
            <Badge variant="secondary">EMI Rs. 22,244</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {[
              { label: "Outstanding", value: "Rs. 7,41,000" },
              { label: "Interest paid", value: "Rs. 1,08,900" },
              { label: "Next due", value: "1 Aug 2026" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[26%] rounded-full bg-[var(--chart-4)]" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Principal paid: Rs. 2,59,000 / Rs. 10,00,000 · 26%
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <Badge variant="secondary" className="mb-3">
            <Landmark className="size-3.5" /> Loans & EMI
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            Every EMI, split into <span className={PINK}>interest and principal</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Record a payment and Finora books the interest as an expense and
            the principal against the loan — automatically, with a full
            amortization schedule you can check anytime.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              "EMI auto-calculated from rate and duration",
              "Amortization schedule, month by month",
              "Outstanding balance straight from the ledger",
            ].map((li) => (
              <li key={li} className="flex items-center gap-2">
                <Check className="size-4 text-[var(--success)]" /> {li}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Up and running in 3 steps
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl border bg-card p-6 text-left">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-[oklch(0.63_0.21_355)] text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "Bank-grade security",
              body: "Row-level security — only your login can read your data.",
            },
            {
              icon: Lock,
              title: "Never lose data",
              body: "Points ran out? Data waits in view-only mode. Nothing is deleted.",
            },
            {
              icon: Languages,
              title: "English + नेपाली",
              body: "Switch the whole app to Nepali with one tap.",
            },
            {
              icon: Smartphone,
              title: "Installable app",
              body: "Add to Home Screen and use it like a native mobile app.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5">
              <c.icon className="size-5 text-[var(--success)]" />
              <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple pricing. <span className={PINK}>No auto-billing.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            1 credit = 1 day of premium. Pay once via eSewa, Khalti or bank
            transfer — your plan never renews behind your back.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => {
              const label = {
                monthly: "Monthly",
                half_yearly: "6 Months",
                yearly: "1 Year",
                lifetime: "Lifetime",
              }[plan.id];
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border bg-card p-6 text-left ${
                    plan.popular ? "border-[oklch(0.63_0.21_355)] shadow-md" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{label}</p>
                    {plan.popular && (
                      <Badge className="bg-[oklch(0.63_0.21_355)] text-white">
                        Most popular
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-bold">
                    {plan.price != null ? formatMoney(plan.price) : "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.points != null
                      ? `${plan.points} credits · ${plan.days} days`
                      : "Unlimited — pay once, keep forever"}
                  </p>
                  <Button
                    className={`mt-5 w-full ${
                      plan.popular
                        ? "bg-[oklch(0.63_0.21_355)] text-white hover:bg-[oklch(0.58_0.21_355)]"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">
                      <Sparkles className="size-4" /> Start now
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Start free and upgrade only when you&apos;re ready — your free plan
            never expires.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border bg-card px-5 py-4 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-[oklch(0.28_0.09_280)] px-8 py-14 text-center text-white shadow-xl">
          <BellRing className="mx-auto size-8 text-[oklch(0.75_0.17_355)]" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Your money already has a story.
            <br />
            <span className="text-[oklch(0.75_0.17_355)]">Start reading it today.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
            Join Finora free — your Nepali chart of accounts is ready in
            seconds, and your first transaction takes ten.
          </p>
          <Button size="lg" className="mt-7 bg-white text-[oklch(0.28_0.09_280)] hover:bg-white/90" asChild>
            <Link href="/signup">
              Start free <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-6" />
            <span>Finora — Your Personal Financial Command Center</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
