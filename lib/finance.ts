/** Formats 852000 as "Rs. 8,52,000" using Nepali lakh/crore grouping. */
export function formatMoney(
  amount: number,
  opts: { currency?: string; signed?: boolean; compact?: boolean } = {},
) {
  const { currency = "NPR", signed = false, compact = false } = opts;

  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: abs % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(abs);

  const symbol = currency === "NPR" ? "Rs." : currency === "USD" ? "$" : currency === "INR" ? "₹" : `${currency} `;
  const sign = amount < 0 ? "-" : signed && amount > 0 ? "+" : "";
  return `${sign}${symbol} ${formatted}`.replace("$ ", "$");
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** First day of the month containing `d`, as YYYY-MM-DD. */
export function monthStart(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** EMI for principal P, annual rate r%, n months. */
export function calculateEMI(principal: number, annualRatePct: number, months: number) {
  if (months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}
