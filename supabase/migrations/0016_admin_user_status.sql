-- Finora — 0016: super-admin can deactivate / reactivate / delete users.
--
-- Deactivating keeps the row (so it can be undone) but blocks the account:
-- the app treats it as signed-out and the reminder cron skips it, which is
-- what stops test accounts from emailing forever.
-- Run after 0015_sync_all_points.sql.

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

-- ---------- Admin: deactivate / reactivate ----------
create or replace function public.set_user_active(
  p_user_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot deactivate your own account';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'user not found';
  end if;
  if v_role = 'super_admin' then
    raise exception 'cannot deactivate another super admin';
  end if;

  update public.profiles
  set deactivated_at = case when p_active then null else now() end
  where id = p_user_id;
end;
$$;

-- ---------- Admin: permanently delete a user ----------
-- Deleting the auth row cascades to profiles and every user-owned table
-- (every user_id FK is `on delete cascade`), so this removes all their data.
create or replace function public.delete_user_account(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot delete your own account';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'user not found';
  end if;
  if v_role = 'super_admin' then
    raise exception 'cannot delete another super admin';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

-- ---------- Entitlements: expose the flag so the app can lock them out ----------
-- Dropped first: adding a column to the returned TABLE changes the signature,
-- which `create or replace` refuses.
drop function if exists public.get_entitlements_fast();

create or replace function public.get_entitlements_fast()
returns table (
  points integer,
  lifetime boolean,
  plan text,
  role text,
  needs_deduction boolean,
  deactivated boolean
)
language sql
stable
security definer set search_path = public
as $$
  select
    p.points,
    p.lifetime,
    p.plan,
    p.role,
    (not p.lifetime and p.points > 0 and current_date > p.points_synced_on)
      as needs_deduction,
    (p.deactivated_at is not null) as deactivated
  from public.profiles p
  where p.id = auth.uid();
$$;

-- ---------- Daily deduction: leave deactivated accounts alone ----------
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
      and deactivated_at is null
  ),
  upd as (
    update public.profiles p
    set points = p.points - d.deduct,
        points_synced_on = current_date,
        plan = case when p.points - d.deduct <= 0 then 'free' else p.plan end
    from due d where p.id = d.id
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
