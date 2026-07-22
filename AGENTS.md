# Finora — agent notes

Personal finance app: Next.js 16 App Router + TypeScript + Tailwind v4 +
shadcn/ui + Supabase (Postgres/Auth/Storage).

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (must pass before committing)
- `npm run lint` — ESLint

## Architecture rules

- **Double-entry core.** The app only writes `transactions`; the
  `sync_postings` DB trigger maintains balanced `postings`. Balances are
  ALWAYS derived from postings (`account_balances` view) — never store a
  mutable balance column, never write to `postings` from the app.
- **Categories are accounts.** Income/expense categories live in `accounts`
  with `kind = 'income' | 'expense'`. Money accounts are `asset`/`liability`.
- **Schema changes** go in new files under `supabase/migrations/`, applied
  with the runner: `node scripts/migrate.js` (`--status` to list,
  `--baseline` to mark existing files as applied without running them).
  It tracks applied files in `schema_migrations` and needs `DATABASE_URL`
  in `.env.local` (Supabase → Settings → Database → connection string;
  use the `aws-0-` pooler host).
- **RLS everywhere:** every table policy is `user_id = auth.uid()`. New
  tables must ship with RLS enabled + policy in the same migration.
- Server components fetch via `lib/data.ts`; mutations via server actions in
  `lib/actions/*` (zod-validated, return `{ error }`/`{ success }` state for
  `useActionState`).
- Supabase clients: `lib/supabase/server.ts` (RSC/actions),
  `lib/supabase/client.ts` (browser). Session refresh + route protection in
  `middleware.ts` → `lib/supabase/middleware.ts`.
- Money formatting: `formatMoney` in `lib/finance.ts` (lakh/crore grouping,
  "Rs." for NPR). Don't hand-roll `Intl.NumberFormat` calls.
- Chart colors: only `--chart-1..5` CSS vars (CVD-validated palettes for
  light and dark). Don't introduce ad-hoc chart hexes.
- Without real env vars, middleware redirects everything to `/setup` — this
  is intentional first-run UX.
- **Entitlements:** call `getEntitlements()` (lib/entitlements.ts) in any
  server action that mutates premium features — it also runs the lazy daily
  point deduction (`sync_points` RPC). Free tier = add income/expense only.
- **i18n:** strings live in `lib/i18n/dictionaries.ts` (en + ne, typed).
  Server components use `getDict()`; client components use `useT()`. Always
  add BOTH translations when adding a key.
- **Admin:** super-admin role lives on `profiles.role`; admin mutations go
  through security-definer RPCs (`review_payment_request`, `adjust_points`)
  which re-check `is_super_admin()` inside the DB.
- Pricing lives in `lib/billing.ts` `PLANS[].price`.
- **Security invariants:** all user-controlled strings interpolated into
  email HTML must go through `esc()` in lib/email.ts; redirect targets from
  query params must be validated internal paths; storage URLs saved to
  profiles must point at our own bucket under the user's folder; cron
  endpoints require CRON_SECRET in production; ledger triggers verify
  account ownership (migration 0006) — keep that check when altering
  sync_postings.
