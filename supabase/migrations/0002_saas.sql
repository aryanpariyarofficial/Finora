-- ============================================================
-- Finora — 0002: SaaS layer
-- Points-based subscriptions (1 point = 1 day), manual payment
-- verification, super-admin role, profile extensions.
-- Run AFTER 0001_init.sql in the Supabase SQL editor.
-- ============================================================

-- ---------- Profile extensions ----------
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'super_admin')),
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'monthly', 'half_yearly', 'yearly', 'lifetime')),
  add column if not exists points integer not null default 0 check (points >= 0),
  add column if not exists lifetime boolean not null default false,
  add column if not exists points_synced_on date not null default current_date,
  add column if not exists bio text,
  add column if not exists phone text,
  add column if not exists email text;

-- Backfill emails and keep them in sync for new signups.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- ---------- Super admin helper (security definer avoids RLS recursion) ----------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Promote the owner account. Change the email here if needed.
update public.profiles p
set role = 'super_admin', lifetime = true, plan = 'lifetime'
from auth.users u
where u.id = p.id and u.email = 'aryanpariyar8463@gmail.com';

-- Recreate the signup bootstrap to also store the email.
create or replace function public.handle_new_user_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_email on auth.users;
create trigger on_auth_user_created_email
  after insert on auth.users
  for each row execute function public.handle_new_user_email();

-- ---------- Payment requests (manual verification flow) ----------
create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,               -- WhatsApp number
  plan text not null check (plan in ('monthly', 'half_yearly', 'yearly', 'lifetime')),
  screenshot_path text not null,     -- payments bucket
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer,
  admin_note text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_requests_status_idx on public.payment_requests (status, created_at desc);
create index payment_requests_user_idx on public.payment_requests (user_id, created_at desc);

alter table public.payment_requests enable row level security;

create policy "insert own pending request" on public.payment_requests
  for insert with check (user_id = auth.uid() and status = 'pending');

create policy "read own requests" on public.payment_requests
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy "admin updates requests" on public.payment_requests
  for update using (public.is_super_admin());

-- ---------- Points ledger (audit trail; written only by definer functions) ----------
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null,              -- 'purchase' | 'daily_deduction' | 'admin_adjust'
  request_id uuid references public.payment_requests (id) on delete set null,
  created_at timestamptz not null default now()
);

create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

alter table public.points_ledger enable row level security;

create policy "read own ledger" on public.points_ledger
  for select using (user_id = auth.uid() or public.is_super_admin());

-- ---------- Admin can read all profiles (for the users panel) ----------
create policy "admin reads profiles" on public.profiles
  for select using (public.is_super_admin());

-- ---------- Lazy daily deduction ----------
-- Called on app load: deducts 1 point per elapsed day (skips lifetime),
-- then returns the fresh entitlement snapshot. No cron needed.
create or replace function public.sync_points()
returns table (points integer, lifetime boolean, plan text, role text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_days integer;
  v_deduct integer;
  v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found then
    return;
  end if;

  if not v_profile.lifetime then
    v_days := current_date - v_profile.points_synced_on;
    if v_days > 0 then
      v_deduct := least(v_days, v_profile.points);
      update public.profiles
      set points = points - v_deduct,
          points_synced_on = current_date,
          plan = case when points - v_deduct <= 0 then 'free' else plan end
      where id = v_profile.id;

      if v_deduct > 0 then
        insert into public.points_ledger (user_id, delta, reason)
        values (v_profile.id, -v_deduct, 'daily_deduction');
      end if;
    end if;
  end if;

  return query
    select p.points, p.lifetime, p.plan, p.role
    from public.profiles p where p.id = auth.uid();
end;
$$;

-- ---------- Admin: review a payment request ----------
-- Approving awards points (or lifetime) atomically and logs to the ledger.
create or replace function public.review_payment_request(
  p_request_id uuid,
  p_action text,                     -- 'approved' | 'rejected'
  p_points integer default null,     -- required when approving a non-lifetime plan
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.payment_requests%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_req from public.payment_requests
  where id = p_request_id and status = 'pending' for update;
  if not found then
    raise exception 'request not found or already reviewed';
  end if;

  if p_action = 'approved' then
    if v_req.plan = 'lifetime' then
      update public.profiles
      set lifetime = true, plan = 'lifetime', points_synced_on = current_date
      where id = v_req.user_id;
    else
      if p_points is null or p_points <= 0 then
        raise exception 'points required for non-lifetime plans';
      end if;
      update public.profiles
      set points = points + p_points,
          plan = v_req.plan,
          points_synced_on = current_date
      where id = v_req.user_id;

      insert into public.points_ledger (user_id, delta, reason, request_id)
      values (v_req.user_id, p_points, 'purchase', v_req.id);
    end if;
  elsif p_action <> 'rejected' then
    raise exception 'invalid action';
  end if;

  update public.payment_requests
  set status = p_action,
      points_awarded = case when p_action = 'approved' then p_points else null end,
      admin_note = p_note,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;
end;
$$;

-- ---------- Admin: manual point adjustment ----------
create or replace function public.adjust_points(
  p_user_id uuid,
  p_delta integer,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set points = greatest(0, points + p_delta),
      points_synced_on = current_date
  where id = p_user_id;

  insert into public.points_ledger (user_id, delta, reason)
  values (p_user_id, p_delta, coalesce('admin_adjust: ' || p_note, 'admin_adjust'));
end;
$$;

-- ---------- Storage: payment screenshots (private) + avatars (public) ----------
insert into storage.buckets (id, name, public)
values ('payments', 'payments', false)
on conflict (id) do nothing;

create policy "users upload own payment proof"
  on storage.objects for insert
  with check (bucket_id = 'payments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner or admin reads payment proof"
  on storage.objects for select
  using (
    bucket_id = 'payments'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin())
  );

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "users manage own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars are public"
  on storage.objects for select
  using (bucket_id = 'avatars');
