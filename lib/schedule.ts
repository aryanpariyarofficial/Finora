import { calculateEMI } from "@/lib/finance";

export interface ScheduleRow {
  n: number;
  startDate: string; // ISO — first day of the period
  endDate: string; // ISO — day before the next due date
  days: number; // days from period start to the due date
  outstanding: number; // balance at the start of the period
  principal: number;
  interest: number;
  emi: number;
  balance: number; // balance after this instalment
  paid: boolean;
  daysRemaining: number | null; // to endDate, if unpaid; null if paid
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: Date, b: Date) {
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86_400_000,
  );
}

/** The `emiDay`-th of (start month + k), clamped to the month's length. */
function dueDate(start: Date, k: number, emiDay: number) {
  const y = start.getFullYear();
  const m = start.getMonth() + k;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(emiDay, lastDay));
}

/**
 * Bank-style amortization schedule.
 *
 * - Payments fall on a fixed day of the month (`emiDay`, e.g. the 10th).
 *   The first period runs from the disbursement date to the day before the
 *   first payment; every later period runs from one payment day to the day
 *   before the next.
 * - Interest is day-count: outstanding × annualRate% × days ÷ 365 — matching
 *   how Nepali banks bill.
 * - `paymentsMade` marks paid rows; `todayISO` drives the days-remaining
 *   countdown (to each period's end date).
 */
export function buildLoanSchedule(opts: {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  startDate: string; // ISO
  emiAmount?: number | null;
  emiDay?: number | null;
  paymentsMade: number;
  todayISO: string;
}): ScheduleRow[] {
  const {
    principal,
    annualRatePct,
    termMonths,
    startDate,
    emiAmount,
    emiDay,
    paymentsMade,
    todayISO,
  } = opts;

  const emi =
    emiAmount && emiAmount > 0
      ? emiAmount
      : calculateEMI(principal, annualRatePct, termMonths);
  const start = new Date(`${startDate}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);
  const day = emiDay && emiDay >= 1 ? emiDay : start.getDate();
  const dailyRate = annualRatePct / 100 / 365;

  const rows: ScheduleRow[] = [];
  let balance = principal;
  let periodStart = start;
  const maxRows = Math.max(termMonths, 600);

  for (let i = 1; i <= maxRows && balance > 0.005; i++) {
    const due = dueDate(start, i, day);
    const days = daysBetween(periodStart, due);
    const end = new Date(due);
    end.setDate(end.getDate() - 1); // period ends the day before the due date

    const interest = balance * dailyRate * days;
    const principalPart = Math.min(emi - interest, balance);
    const opening = balance;
    balance -= principalPart;

    const paid = i <= paymentsMade;

    rows.push({
      n: i,
      startDate: toISO(periodStart),
      endDate: toISO(end),
      days,
      outstanding: Math.round(opening * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      paid,
      daysRemaining: paid ? null : daysBetween(today, end),
    });

    periodStart = due; // next period starts on this payment day
  }

  return rows;
}
