-- Finora — 0013: EMI due day of month for loans.
-- Banks bill on a fixed day (e.g. the 10th), independent of the disbursement
-- date. This drives the amortization schedule's period boundaries.
-- Run after 0012_entitlements_fast.sql.

alter table public.loans
  add column if not exists emi_day int check (emi_day between 1 and 31);

-- Backfill existing loans to the disbursement day.
update public.loans
set emi_day = extract(day from start_date)::int
where emi_day is null;
