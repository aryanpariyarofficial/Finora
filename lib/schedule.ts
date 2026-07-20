import { calculateEMI } from "@/lib/finance";

export interface ScheduleRow {
  n: number;
  startDate: string; // ISO
  endDate: string; // ISO
  days: number;
  outstanding: number; // balance at the start of the period
  principal: number;
  interest: number;
  emi: number;
  balance: number; // balance after this instalment
  paid: boolean;
  daysRemaining: number | null; // to endDate, if unpaid & future; null if paid
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function daysBetween(a: Date, b: Date) {
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86_400_000,
  );
}

/**
 * Full amortization schedule for a loan. `paymentsMade` marks how many
 * instalments have already been recorded (those rows show as paid), and
 * `todayISO` drives the days-remaining countdown for upcoming ones.
 */
export function buildLoanSchedule(opts: {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  startDate: string; // ISO
  emiAmount?: number | null;
  paymentsMade: number;
  todayISO: string;
}): ScheduleRow[] {
  const {
    principal,
    annualRatePct,
    termMonths,
    startDate,
    emiAmount,
    paymentsMade,
    todayISO,
  } = opts;

  const emi =
    emiAmount && emiAmount > 0
      ? emiAmount
      : calculateEMI(principal, annualRatePct, termMonths);
  const monthlyRate = annualRatePct / 12 / 100;
  const start = new Date(`${startDate}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);

  const rows: ScheduleRow[] = [];
  let balance = principal;
  const maxRows = Math.max(termMonths, 600);

  for (let i = 1; i <= maxRows && balance > 0.005; i++) {
    const periodStart = addMonths(start, i - 1);
    const periodEnd = addMonths(start, i);
    const interest = balance * monthlyRate;
    const principalPart = Math.min(emi - interest, balance);
    const opening = balance;
    balance -= principalPart;

    const paid = i <= paymentsMade;
    const dr = paid ? null : daysBetween(today, periodEnd);

    rows.push({
      n: i,
      startDate: toISO(periodStart),
      endDate: toISO(periodEnd),
      days: daysBetween(periodStart, periodEnd),
      outstanding: Math.round(opening * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      paid,
      daysRemaining: dr,
    });
  }

  return rows;
}
