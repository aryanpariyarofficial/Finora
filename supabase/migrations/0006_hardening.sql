-- Finora — 0006: ledger integrity + privilege-escalation hardening.
-- Run after 0005_referrals.sql.

-- ============================================================
-- CRITICAL: lock down privileged profile columns.
-- The "own profile" RLS policy lets a user UPDATE their own row, but the
-- row also holds role / plan / points / lifetime / referral_code /
-- referred_by / email. Without a column restriction, any user could
-- self-promote to super_admin or grant themselves lifetime premium from
-- the browser (supabase.from('profiles').update({role:'super_admin'})).
--
-- Fix with column-level privileges: the `authenticated`/`anon` API roles
-- may only UPDATE the safe, user-editable columns. All the privileged
-- columns are still writable by our SECURITY DEFINER functions
-- (sync_points, review_payment_request, adjust_points, apply_referral…)
-- because those execute as the table owner and bypass column grants.
-- RLS still applies on top of this.
-- ============================================================

revoke update on public.profiles from anon, authenticated;

grant update (full_name, avatar_url, currency, bio, phone, locale, calendar)
  on public.profiles to authenticated;

-- Ensure every account a transaction references belongs to the same user.
-- Without this, a crafted insert could reference another user's account ids
-- (RLS hides the postings from the victim, but the ledger should never
-- contain cross-user references at all).
create or replace function public.sync_postings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
  v_expected integer;
begin
  -- Ownership check: all referenced accounts must belong to the tx user.
  select count(*) into v_count
  from public.accounts a
  where a.user_id = new.user_id
    and a.id in (new.account_id, new.category_id, new.counter_account_id);

  select count(distinct x) into v_expected
  from unnest(array[new.account_id, new.category_id, new.counter_account_id]) as x
  where x is not null;

  if v_count < v_expected then
    raise exception 'account does not belong to user';
  end if;

  delete from public.postings where transaction_id = new.id;

  if new.type = 'income' then
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.account_id, new.amount),
      (new.id, new.user_id, new.category_id, -new.amount);
  elsif new.type = 'expense' then
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.category_id, new.amount),
      (new.id, new.user_id, new.account_id, -new.amount);
  else
    insert into public.postings (transaction_id, user_id, account_id, amount) values
      (new.id, new.user_id, new.counter_account_id, new.amount),
      (new.id, new.user_id, new.account_id, -new.amount);
  end if;

  return new;
end;
$$;

-- ---------- Referral abuse: cap invites per referrer per month ----------
-- Recreated from 0005 with a rolling 30-day cap to blunt point farming
-- (premium requirement + 7-day invitee age check remain).
create or replace function public.apply_referral(p_referred_id uuid, p_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer public.profiles%rowtype;
  v_referred public.profiles%rowtype;
  v_recent integer;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return false;
  end if;

  select * into v_referred from public.profiles where id = p_referred_id for update;
  if not found or v_referred.referred_by is not null then
    return false;
  end if;
  if v_referred.created_at < now() - interval '7 days' then
    return false;
  end if;

  select * into v_referrer from public.profiles
  where referral_code = upper(trim(p_code)) and id <> p_referred_id
  for update;
  if not found then
    return false;
  end if;

  if not (v_referrer.lifetime or v_referrer.points > 0) then
    return false;
  end if;

  -- Rolling 30-day cap: at most 20 rewarded referrals per referrer.
  select count(*) into v_recent from public.referrals
  where referrer_id = v_referrer.id and created_at > now() - interval '30 days';
  if v_recent >= 20 then
    return false;
  end if;

  update public.profiles set referred_by = v_referrer.id where id = p_referred_id;

  update public.profiles
  set points = points + 30, points_synced_on = current_date
  where id = p_referred_id and not lifetime;

  update public.profiles
  set points = points + 30, points_synced_on = current_date
  where id = v_referrer.id and not lifetime;

  insert into public.points_ledger (user_id, delta, reason) values
    (p_referred_id, 30, 'referral_bonus'),
    (v_referrer.id, 30, 'referral_bonus');

  insert into public.referrals (referrer_id, referred_id, points_awarded)
  values (v_referrer.id, p_referred_id, 30);

  return true;
end;
$$;

-- Budgets: the category must be the user's own expense category.
create or replace function public.check_budget_category()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.accounts a
    where a.id = new.category_id
      and a.user_id = new.user_id
      and a.kind = 'expense'
  ) then
    raise exception 'category does not belong to user';
  end if;
  return new;
end;
$$;

drop trigger if exists budgets_check_category on public.budgets;
create trigger budgets_check_category
  before insert or update on public.budgets
  for each row execute function public.check_budget_category();
