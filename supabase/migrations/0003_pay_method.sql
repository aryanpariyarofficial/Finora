-- Finora — 0003: record which channel the user paid through.
-- Run after 0002_saas.sql.

alter table public.payment_requests
  add column if not exists pay_method text
    check (pay_method in ('esewa', 'khalti', 'nepal_sbi', 'global_ime', 'laxmi_sunrise'));
