-- ============================================================
-- Finora — initial schema
-- Double-entry core: every transaction produces balanced
-- postings (debits + credits sum to zero) via trigger.
-- The app only ever writes to `transactions`; the ledger
-- (`postings`) is maintained automatically and is the single
-- source of truth for all balances.
-- ============================================================

-- ---------- Enums ----------
create type public.account_kind as enum ('asset', 'liability', 'income', 'expense', 'equity');
create type public.transaction_type as enum ('income', 'expense', 'transfer', 'adjustment');
create type public.payment_method as enum ('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'card', 'cheque', 'other');
create type public.investment_type as enum ('fd', 'shares', 'crypto', 'gold', 'mutual_fund', 'business', 'other');

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  currency text not null default 'NPR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Chart of accounts ----------
-- Money accounts (Cash, NIC Asia, eSewa …) are kind = 'asset' / 'liability'.
-- Categories (Salary, Food, Fuel …) are kind = 'income' / 'expense'.
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind public.account_kind not null,
  subtype text,                       -- e.g. 'cash' | 'bank' | 'wallet' | 'loan'
  icon text,
  color text,
  currency text not null default 'NPR',
  is_archived boolean not null default false,
  is_system boolean not null default false,  -- seeded defaults (Opening Balances etc.)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

create index accounts_user_kind_idx on public.accounts (user_id, kind) where not is_archived;

-- ---------- Transactions (what the app writes) ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  account_id uuid not null references public.accounts (id),          -- money account (asset/liability)
  category_id uuid references public.accounts (id),                  -- income/expense account
  counter_account_id uuid references public.accounts (id),           -- transfer target / adjustment equity
  payment_method public.payment_method,
  description text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type in ('income', 'expense') and category_id is not null)
    or (type in ('transfer', 'adjustment') and counter_account_id is not null)
  )
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc, created_at desc);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_account_idx on public.transactions (account_id);

-- ---------- Postings (the double-entry ledger) ----------
-- Signed amounts: positive = debit, negative = credit.
-- Sum per transaction is always zero (enforced by the sync trigger
-- being the only writer).
create table public.postings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id),
  amount numeric(14, 2) not null check (amount <> 0),
  created_at timestamptz not null default now()
);

create index postings_account_idx on public.postings (account_id);
create index postings_transaction_idx on public.postings (transaction_id);
create index postings_user_idx on public.postings (user_id);

-- Rebuild the balanced postings for a transaction row.
create or replace function public.sync_postings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.postings where transaction_id = new.id;

  if new.type = 'income' then
    -- debit money account, credit income category
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.account_id, new.amount),
      (new.id, new.user_id, new.category_id, -new.amount);
  elsif new.type = 'expense' then
    -- debit expense category, credit money account
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.category_id, new.amount),
      (new.id, new.user_id, new.account_id, -new.amount);
  else
    -- transfer / adjustment: debit counter account, credit source account
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.counter_account_id, new.amount),
      (new.id, new.user_id, new.account_id, -new.amount);
  end if;

  return new;
end;
$$;

create trigger transactions_sync_postings
  after insert or update on public.transactions
  for each row execute function public.sync_postings();

-- ---------- Attachments (bills, receipts, invoices) ----------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  tag text,
  created_at timestamptz not null default now()
);

create index attachments_user_idx on public.attachments (user_id, created_at desc);

-- ---------- Budgets ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.accounts (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- ---------- Loans ----------
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  liability_account_id uuid not null references public.accounts (id),
  lender text not null,
  principal numeric(14, 2) not null check (principal > 0),
  annual_interest_rate numeric(5, 2) not null default 0,
  start_date date not null,
  term_months int not null check (term_months > 0),
  emi_amount numeric(14, 2),
  status text not null default 'active' check (status in ('active', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  loan_id uuid not null references public.loans (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  paid_on date not null,
  principal_component numeric(14, 2) not null default 0,
  interest_component numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Investments ----------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_account_id uuid references public.accounts (id),
  type public.investment_type not null,
  name text not null,
  invested_amount numeric(14, 2) not null check (invested_amount > 0),
  current_value numeric(14, 2) not null,
  expected_return_pct numeric(5, 2),
  invested_on date not null,
  matures_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  investment_id uuid not null references public.investments (id) on delete cascade,
  valued_on date not null,
  value numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- updated_at maintenance ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger loans_updated_at before update on public.loans for each row execute function public.set_updated_at();
create trigger investments_updated_at before update on public.investments for each row execute function public.set_updated_at();

-- ---------- Views ----------
-- Natural-sign balances: assets/expenses grow with debits,
-- liabilities/income/equity grow with credits.
create or replace view public.account_balances
with (security_invoker = on) as
select
  a.id,
  a.user_id,
  a.name,
  a.kind,
  a.subtype,
  a.icon,
  a.color,
  a.currency,
  a.is_archived,
  a.sort_order,
  case
    when a.kind in ('asset', 'expense') then coalesce(sum(p.amount), 0)
    else -coalesce(sum(p.amount), 0)
  end as balance
from public.accounts a
left join public.postings p on p.account_id = a.id
group by a.id;

-- ---------- New-user bootstrap: profile + default chart of accounts ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  -- equity
  insert into public.accounts (user_id, name, kind, is_system, sort_order) values
    (new.id, 'Opening Balances', 'equity', true, 0);

  -- money accounts
  insert into public.accounts (user_id, name, kind, subtype, icon, sort_order) values
    (new.id, 'Cash', 'asset', 'cash', 'banknote', 1),
    (new.id, 'Bank', 'asset', 'bank', 'landmark', 2),
    (new.id, 'eSewa', 'asset', 'wallet', 'wallet', 3),
    (new.id, 'Khalti', 'asset', 'wallet', 'wallet', 4);

  -- income categories
  insert into public.accounts (user_id, name, kind, icon, sort_order) values
    (new.id, 'Salary', 'income', 'briefcase', 1),
    (new.id, 'Business', 'income', 'store', 2),
    (new.id, 'Freelance', 'income', 'laptop', 3),
    (new.id, 'Investment Return', 'income', 'trending-up', 4),
    (new.id, 'Rental', 'income', 'home', 5),
    (new.id, 'Bonus', 'income', 'gift', 6),
    (new.id, 'Gift', 'income', 'gift', 7),
    (new.id, 'Other Income', 'income', 'plus-circle', 8);

  -- expense categories
  insert into public.accounts (user_id, name, kind, icon, sort_order) values
    (new.id, 'Food', 'expense', 'utensils', 1),
    (new.id, 'Fuel', 'expense', 'fuel', 2),
    (new.id, 'Rent', 'expense', 'home', 3),
    (new.id, 'Shopping', 'expense', 'shopping-bag', 4),
    (new.id, 'Travel', 'expense', 'plane', 5),
    (new.id, 'Entertainment', 'expense', 'clapperboard', 6),
    (new.id, 'Medical', 'expense', 'heart-pulse', 7),
    (new.id, 'Utilities', 'expense', 'zap', 8),
    (new.id, 'Internet', 'expense', 'wifi', 9),
    (new.id, 'Education', 'expense', 'graduation-cap', 10),
    (new.id, 'Office', 'expense', 'building-2', 11),
    (new.id, 'Tax', 'expense', 'receipt', 12),
    (new.id, 'Other Expense', 'expense', 'circle-ellipsis', 13);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.postings enable row level security;
alter table public.attachments enable row level security;
alter table public.budgets enable row level security;
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;
alter table public.investments enable row level security;
alter table public.investment_history enable row level security;
alter table public.notifications enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own accounts" on public.accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Postings are written only by the sync trigger (security definer);
-- users get read-only access to their own rows.
create policy "read own postings" on public.postings
  for select using (user_id = auth.uid());

create policy "own attachments" on public.attachments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own budgets" on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own loans" on public.loans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own loan_payments" on public.loan_payments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own investments" on public.investments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own investment_history" on public.investment_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notifications" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Storage: receipts bucket ----------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "users manage own receipts"
  on storage.objects for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
