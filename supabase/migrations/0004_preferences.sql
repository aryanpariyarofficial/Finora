-- Finora — 0004: user display preferences (default language + calendar).
-- Run after 0003_pay_method.sql.

alter table public.profiles
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'ne')),
  add column if not exists calendar text not null default 'ad'
    check (calendar in ('ad', 'bs'));
