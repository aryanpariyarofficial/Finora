-- Finora — 0012: lock-free entitlement reads.
-- sync_points() takes a SELECT ... FOR UPDATE row lock and only needs to run
-- once a day (for the deduction). This read-only helper lets the app skip
-- that lock on every other navigation while keeping points always fresh.
-- Run after 0011_trial.sql.

create or replace function public.get_entitlements_fast()
returns table (
  points integer,
  lifetime boolean,
  plan text,
  role text,
  needs_deduction boolean
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
      as needs_deduction
  from public.profiles p
  where p.id = auth.uid();
$$;
