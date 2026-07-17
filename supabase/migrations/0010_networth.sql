-- Finora — 0010: net worth timeline.
-- Net worth at a point in time = assets − liabilities, derived from the
-- ledger (sum of postings on asset+liability accounts up to that date).
-- Run after 0009_goals.sql.

create or replace function public.net_worth_timeline(p_months int default 12)
returns table (month_end date, net_worth numeric)
language sql
stable
security definer set search_path = public
as $$
  with months as (
    select (date_trunc('month', current_date) - (interval '1 month' * g))::date as m
    from generate_series(0, greatest(p_months, 1) - 1) g
  ),
  bounds as (
    select (m + interval '1 month' - interval '1 day')::date as month_end
    from months
  )
  select
    b.month_end,
    coalesce((
      select sum(p.amount)
      from public.postings p
      join public.transactions t on t.id = p.transaction_id
      join public.accounts a on a.id = p.account_id
      where p.user_id = auth.uid()
        and a.kind in ('asset', 'liability')
        and t.occurred_on <= b.month_end
    ), 0) as net_worth
  from bounds b
  order by b.month_end;
$$;
