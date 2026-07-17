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
2. Open the **SQL Editor** and run the whole contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
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

## Roadmap

- **Phase 1 (done):** auth, dashboard, income/expense/transfer, accounts,
  categories, filters/search
- **Phase 2:** budgets, loans + EMI schedules, investments + ROI, reports,
  receipt uploads, notifications
- **Phase 3:** AI insights, OCR bill scan, bank statement import, recurring
  transactions
- **Phase 4:** mobile app, offline sync, shared accounts, multi-currency,
  tax reports

## Deployment

Vercel + Supabase free tiers are enough to start. Push to GitHub, import
into Vercel, add the two env vars, done.
