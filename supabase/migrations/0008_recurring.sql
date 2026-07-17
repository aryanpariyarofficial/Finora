-- Finora — 0008: recurring transactions.
-- Rules that auto-generate transactions on their schedule (salary, rent,
-- subscriptions…). Generation is lazy: generate_due_recurring() runs on app
-- load and back-fills any missed periods.
-- Run after 0007_onboarding.sql.

create type public.recurrence_freq as enum ('weekly', 'monthly', 'yearly');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  account_id uuid not null references public.accounts (id),
  category_id uuid references public.accounts (id),
  counter_account_id uuid references public.accounts (id),
  payment_method public.payment_method,
  description text,
  frequency public.recurrence_freq not null,
  interval_count int not null default 1 check (interval_count > 0),
  next_run date not null,
  last_run date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type in ('income', 'expense') and category_id is not null)
    or (type in ('transfer', 'adjustment') and counter_account_id is not null)
  )
);

create index recurring_user_idx on public.recurring_transactions (user_id, active);

create trigger recurring_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "own recurring" on public.recurring_transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Lazy generation ----------
create or replace function public.generate_due_recurring()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  r public.recurring_transactions%rowtype;
  v_count integer := 0;
  v_guard integer;
begin
  for r in
    select * from public.recurring_transactions
    where user_id = auth.uid() and active and next_run <= current_date
    for update
  loop
    v_guard := 0;
    while r.next_run <= current_date and v_guard < 60 loop
      insert into public.transactions (
        user_id, type, amount, occurred_on, account_id, category_id,
        counter_account_id, payment_method, description
      ) values (
        r.user_id, r.type, r.amount, r.next_run, r.account_id,
        case when r.type in ('income', 'expense') then r.category_id else null end,
        case when r.type in ('transfer', 'adjustment') then r.counter_account_id else null end,
        r.payment_method,
        coalesce(r.description, '') || ' (recurring)'
      );

      r.next_run := case r.frequency
        when 'weekly' then r.next_run + (r.interval_count * 7)
        when 'monthly' then (r.next_run + (r.interval_count || ' months')::interval)::date
        when 'yearly' then (r.next_run + (r.interval_count || ' years')::interval)::date
      end;

      v_count := v_count + 1;
      v_guard := v_guard + 1;
    end loop;

    update public.recurring_transactions
    set next_run = r.next_run, last_run = current_date
    where id = r.id;
  end loop;

  return v_count;
end;
$$;
