-- Finora — 0011: 3-day free trial.
-- Every free user (existing + future) gets 3 points = 3 days of full premium
-- access. The daily sync_points deduction counts it down; the low-points
-- cron then emails "premium expires soon" at 3/2/1 days, nudging a purchase.
-- Run after 0010_networth.sql.

-- 1) Existing free users (0 points, not lifetime) get the 3-day trial.
--    Users with a real purchase or referral bonus (points > 0) are untouched.
update public.profiles
set points = 3, points_synced_on = current_date
where lifetime = false and points = 0;

-- 2) Every new signup gets 3 trial points — unless a referral already
--    granted them points (don't overwrite the referral bonus).
create or replace function public.grant_trial_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set points = 3, points_synced_on = current_date
  where id = new.id and lifetime = false and points = 0;
  return new;
end;
$$;

-- Runs after the profile-creating / referral triggers (alphabetical order:
-- ..._created < ..._created_email < ..._created_referral < ..._created_trial).
drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial
  after insert on auth.users
  for each row execute function public.grant_trial_points();
