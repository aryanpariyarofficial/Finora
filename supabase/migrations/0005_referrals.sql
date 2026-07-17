-- Finora — 0005: referral program.
-- Premium referrers and their invitees each get 30 points (1 month).
-- Run after 0004_preferences.sql.

-- ---------- Referral columns ----------
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles (id);

-- Backfill codes for existing users.
update public.profiles
set referral_code = upper(substr(md5(id::text || random()::text), 1, 8))
where referral_code is null;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "read own referrals" on public.referrals
  for select using (referrer_id = auth.uid() or public.is_super_admin());

-- ---------- Award logic (single source of truth) ----------
-- Rules: valid code, not self, invitee not already referred,
-- invitee account younger than 7 days, and the REFERRER must be
-- premium (lifetime or points > 0). Both sides get 30 points.
create or replace function public.apply_referral(p_referred_id uuid, p_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer public.profiles%rowtype;
  v_referred public.profiles%rowtype;
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

  -- Premium-only: free users don't earn referral rewards.
  if not (v_referrer.lifetime or v_referrer.points > 0) then
    return false;
  end if;

  update public.profiles
  set referred_by = v_referrer.id
  where id = p_referred_id;

  -- 30 points (1 month) each.
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

-- Invitee-callable wrapper (for OAuth signups where the code arrives
-- via cookie after the account exists).
create or replace function public.claim_referral(p_code text)
returns boolean
language sql
security definer set search_path = public
as $$
  select public.apply_referral(auth.uid(), p_code);
$$;

-- ---------- New signups: generate code + apply referral from metadata ----------
create or replace function public.handle_new_user_referral()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set referral_code = upper(substr(md5(new.id::text || random()::text), 1, 8))
  where id = new.id and referral_code is null;

  perform public.apply_referral(
    new.id,
    new.raw_user_meta_data ->> 'referred_by_code'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_referral on auth.users;
create trigger on_auth_user_created_referral
  after insert on auth.users
  for each row execute function public.handle_new_user_referral();
