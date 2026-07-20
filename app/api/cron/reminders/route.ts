import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBudgetExceededEmail,
  sendEmiReminderEmail,
  sendLowPointsEmail,
  sendMaturityReminderEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/** Days before a due date that the reminder goes out. */
const REMIND_WITHIN_DAYS = 3;

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextDueDate(startDate: string, paymentsCount: number) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setMonth(d.getMonth() + paymentsCount + 1);
  return d;
}

/**
 * Daily job (Vercel Cron): emails users whose loan EMI is due within the
 * next 3 days, and whose investments mature within the next 3 days.
 * Deduped via the notifications table, one notification per due date.
 */
export async function GET(request: Request) {
  // In production the secret is mandatory — an open endpoint would let
  // anyone trigger email sends.
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500 },
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + REMIND_WITHIN_DAYS);

  let emiSent = 0;
  let maturitySent = 0;
  let budgetSent = 0;
  let lowPointsSent = 0;

  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthFirst = `${monthStr}-01`;

  async function notifyOnce(
    userId: string,
    dedupeKey: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    const { data: existing } = await supabase!
      .from("notifications")
      .select("id")
      .eq("type", dedupeKey)
      .limit(1);
    if (existing && existing.length > 0) return false;
    await supabase!
      .from("notifications")
      .insert({ user_id: userId, type: dedupeKey, title, body });
    return true;
  }

  // ---------- Loan EMI reminders ----------
  const { data: loans } = await supabase
    .from("loans")
    .select("id, user_id, lender, emi_amount, start_date, liability_account_id, status")
    .eq("status", "active");

  for (const loan of loans ?? []) {
    const { count } = await supabase
      .from("loan_payments")
      .select("id", { count: "exact", head: true })
      .eq("loan_id", loan.id);

    const due = nextDueDate(loan.start_date, count ?? 0);
    if (due < today || due > horizon) continue;

    const dueISO = toISODate(due);
    const dedupeKey = `emi_due:${loan.id}:${dueISO}`;

    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", dedupeKey)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const [{ data: profile }, { data: postings }] = await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", loan.user_id)
        .single(),
      supabase
        .from("postings")
        .select("amount")
        .eq("account_id", loan.liability_account_id),
    ]);
    if (!profile?.email) continue;

    const outstanding = -(postings ?? []).reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );
    if (outstanding <= 0) continue;

    await sendEmiReminderEmail({
      email: profile.email,
      fullName: profile.full_name,
      lender: loan.lender,
      emiAmount: loan.emi_amount != null ? Number(loan.emi_amount) : null,
      dueDate: dueISO,
      outstanding,
    });

    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      type: dedupeKey,
      title: `EMI due ${dueISO} — ${loan.lender}`,
      body: `Your loan payment for ${loan.lender} is due on ${dueISO}.`,
    });
    emiSent++;
  }

  // ---------- Investment maturity reminders ----------
  const { data: investments } = await supabase
    .from("investments")
    .select("id, user_id, name, matures_on, current_value")
    .not("matures_on", "is", null)
    .gte("matures_on", toISODate(today))
    .lte("matures_on", toISODate(horizon));

  for (const inv of investments ?? []) {
    const dedupeKey = `investment_maturity:${inv.id}:${inv.matures_on}`;

    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", dedupeKey)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", inv.user_id)
      .single();
    if (!profile?.email) continue;

    await sendMaturityReminderEmail({
      email: profile.email,
      fullName: profile.full_name,
      investmentName: inv.name,
      maturesOn: inv.matures_on,
      currentValue: Number(inv.current_value),
    });

    await supabase.from("notifications").insert({
      user_id: inv.user_id,
      type: dedupeKey,
      title: `Investment maturing ${inv.matures_on} — ${inv.name}`,
      body: `Your investment ${inv.name} matures on ${inv.matures_on}.`,
    });
    maturitySent++;
  }

  // ---------- Budget-exceeded alerts (once per budget per month) ----------
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, user_id, category_id, amount")
    .eq("month", monthFirst);

  for (const b of budgets ?? []) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .eq("category_id", b.category_id)
      .gte("occurred_on", monthFirst)
      .lt("occurred_on", toISODate(monthEnd));
    const spent = (txs ?? []).reduce((acc, x) => acc + Number(x.amount), 0);
    const ratio = spent / Number(b.amount);
    if (ratio < 0.9) continue; // alert at 90%+

    const over = spent > Number(b.amount);
    const [{ data: profile }, { data: cat }] = await Promise.all([
      supabase.from("profiles").select("email, full_name").eq("id", b.user_id).single(),
      supabase.from("accounts").select("name").eq("id", b.category_id).single(),
    ]);
    if (!profile?.email) continue;

    const catName = cat?.name ?? "category";
    const fresh = await notifyOnce(
      b.user_id,
      `budget_${over ? "exceeded" : "near"}:${b.id}:${monthStr}`,
      over
        ? `Budget exceeded — ${catName}`
        : `Budget almost used — ${catName}`,
      over
        ? `You've spent over your ${catName} budget this month.`
        : `You've used ${Math.round(ratio * 100)}% of your ${catName} budget.`,
    );
    if (!fresh) continue;

    // Only email when actually over budget; the in-app alert covers 90%.
    if (over) {
      await sendBudgetExceededEmail({
        email: profile.email,
        fullName: profile.full_name,
        category: catName,
        spent,
        budget: Number(b.amount),
      });
    }
    budgetSent++;
  }

  // ---------- Low-points warnings (premium about to expire) ----------
  const { data: lowUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, points")
    .eq("lifetime", false)
    .gt("points", 0)
    .lte("points", 5);

  for (const u of lowUsers ?? []) {
    if (!u.email) continue;
    const fresh = await notifyOnce(
      u.id,
      `low_points:${u.id}:${toISODate(today)}`,
      `Premium expires in ${u.points} day${u.points === 1 ? "" : "s"}`,
      `Top up to keep your premium features.`,
    );
    if (!fresh) continue;

    await sendLowPointsEmail({
      email: u.email,
      fullName: u.full_name,
      points: Number(u.points),
    });
    lowPointsSent++;
  }

  return NextResponse.json({
    ok: true,
    emiSent,
    maturitySent,
    budgetSent,
    lowPointsSent,
  });
}
