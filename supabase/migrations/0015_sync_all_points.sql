-- Finora — 0015: daily credit deduction for ALL users.
--
-- sync_points() only runs when a user opens the app (lazy), so an inactive
-- user's balance goes stale — the reminder cron then read a stale value and
-- kept mailing "expires in 3 days" every day. This service-role function
-- performs the elapsed-day deduction for everyone, so the stored balance is
-- always accurate for emails, notifications and gating.
-- Run after 0014_gift_expense.sql.

create or replace function public.sync_all_points()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer := 0;
begin
  with due as (
    select id, least(points, (current_date - points_synced_on)) as deduct
    from public.profiles
    where lifetime = false
      and points > 0
      and points_synced_on < current_date
  ),
  upd as (
    update public.profiles p
    set points = p.points - d.deduct,
        points_synced_on = current_date,
        plan = case when p.points - d.deduct <= 0 then 'free' else p.plan end
    from due d
    where p.id = d.id
    returning p.id, d.deduct
  ),
  logged as (
    insert into public.points_ledger (user_id, delta, reason)
    select id, -deduct, 'daily_deduction' from upd where deduct > 0
    returning 1
  )
  select count(*) into v_count from logged;

  return v_count;
end;
$$;
