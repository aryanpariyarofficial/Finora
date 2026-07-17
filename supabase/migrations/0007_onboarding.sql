-- Finora — 0007: onboarding flag.
-- Run after 0006_hardening.sql.

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

-- Let users mark their own onboarding complete (safe column).
grant update (onboarded_at) on public.profiles to authenticated;
