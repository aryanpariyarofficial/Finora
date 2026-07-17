# Finora

**Your Personal Financial Command Center.**

Track income, expenses, budgets, loans and investments — built on a
double-entry accounting core so your numbers always add up.

![Finora brand kit](public/branding/finora-brand-kit.png)

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui + Recharts
- **Supabase** — PostgreSQL, Auth (email + Google), Storage, Row Level Security

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open the **SQL Editor** and run, in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   - [`supabase/migrations/0002_saas.sql`](supabase/migrations/0002_saas.sql)
     (points/plans, payment verification, super-admin — edit the admin email
     inside before running)
3. (Optional) Enable **Google** under Authentication → Providers

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
Project Settings → API.

### 4. Run

```bash
npm run dev
```

Until `.env.local` has real credentials, every route redirects to `/setup`
with these same instructions.

## Architecture: double-entry under the hood

The app writes simple rows to `transactions` (type, amount, account,
category). A database trigger (`sync_postings`) converts every transaction
into balanced ledger **postings** (debits + credits that sum to zero) against
a per-user **chart of accounts**:

| Kind | Examples |
|---|---|
| `asset` | Cash, NIC Asia, eSewa, Khalti |
| `liability` | Loans, credit cards |
| `income` | Salary, Business, Freelance (your income *categories*) |
| `expense` | Food, Fuel, Rent (your expense *categories*) |
| `equity` | Opening Balances |

All balances come from summing postings (`account_balances` view) — never
from a mutable "balance" column — so accounts can never drift out of sync.
This is what makes loans, investments, net worth and bank reconciliation
possible later without schema rewrites.

New users automatically get a default chart of accounts (Nepali wallets
included) via the `handle_new_user` trigger.

## Project structure

```
app/
  (auth)/         login, signup, forgot-password
  (app)/          dashboard, transactions, accounts, budgets,
                  loans, investments, reports, settings
  auth/callback/  OAuth + email-link handler
  setup/          first-run instructions
components/       ui/ (shadcn), dashboard/, transactions/, accounts/…
lib/
  supabase/       browser/server clients + session middleware
  actions/        server actions (auth, transactions, accounts, profile)
  data.ts         dashboard/report queries
  finance.ts      Rs. formatting (lakh/crore), EMI math
supabase/
  migrations/     0001_init.sql — schema, triggers, RLS, storage
```

## SaaS model (points system)

1 point = 1 day of premium access, deducted lazily on app load (no cron).
Plans: Monthly 30 pts · 6-Month 180 pts · Yearly 365 pts · Lifetime ∞.
Users pay via eSewa/Khalti, submit a screenshot on `/upgrade`, and the
super admin approves it on `/admin` (points are credited atomically with an
audit ledger). Free tier: simple income/expense entry, latest 5 transactions,
everything else view-only. Prices are placeholders in `lib/billing.ts`.

## Features

- **i18n:** English (default) + नेपाली via the top-bar switcher (cookie based)
- **Dashboard:** balances, income/expense, net, savings rate, cash flow,
  category donut, loan & investment widgets
- **Transactions:** income/expense/transfer, filters, search, Excel/PDF export
- **Budgets:** monthly per-category limits with live progress
- **Loans:** ledger-integrated disbursement, EMI auto-calc, payment splitting
  (interest → expense, principal → liability), amortization schedule
- **Investments:** FD/shares/crypto/gold/MF, ROI, value history
- **Reports:** period picker, category breakdowns, monthly trend, export
- **Profile:** avatar upload, bio, phone; **Admin:** payment verification +
  point management
- **PWA:** installable on mobile with the Finora app icon

## Roadmap

- **Phase 1 + 2 (done):** everything above
- **Phase 3:** AI insights, OCR bill scan, bank statement import, recurring
  transactions, notifications
- **Phase 4:** mobile app (React Native), offline sync, shared accounts,
  multi-currency, tax reports

## Deployment

Vercel + Supabase free tiers are enough to start. Push to GitHub, import
into Vercel, add the two env vars, done.
