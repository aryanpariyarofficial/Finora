-- Finora — 0014: add a "Gift" expense category.
-- "Gift" already exists as an income category; this adds the expense side
-- (money spent on gifts). Categories are accounts, so once seeded it shows
-- up everywhere categories are used. Run after 0013_loan_emi_day.sql.

-- 1) Backfill for existing users that don't already have a Gift expense.
insert into public.accounts (user_id, name, kind, icon, sort_order)
select p.id, 'Gift', 'expense', 'gift', 14
from public.profiles p
where not exists (
  select 1 from public.accounts a
  where a.user_id = p.id and a.kind = 'expense' and a.name = 'Gift'
);

-- 2) New signups get it too, via a small trigger (runs after the profile /
--    default-accounts trigger).
create or replace function public.seed_gift_expense()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.accounts (user_id, name, kind, icon, sort_order)
  values (new.id, 'Gift', 'expense', 'gift', 14)
  on conflict (user_id, kind, name) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_gift on auth.users;
create trigger on_auth_user_created_gift
  after insert on auth.users
  for each row execute function public.seed_gift_expense();
