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
- **Schema changes** go in new files under `supabase/migrations/` (they are
  run manually in the Supabase SQL editor; there is no migration runner yet).
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
