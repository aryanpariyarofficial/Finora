-- Finora — 0009: savings goals.
-- Run after 0008_recurring.sql.

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  saved_amount numeric(14, 2) not null default 0 check (saved_amount >= 0),
  target_date date,
  color text,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index savings_goals_user_idx on public.savings_goals (user_id);

create trigger savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

alter table public.savings_goals enable row level security;

create policy "own goals" on public.savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
