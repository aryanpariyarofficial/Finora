import { Resend } from "resend";
import { formatMoney } from "@/lib/finance";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aryanpariyar8463@gmail.com";
const WHATSAPP_NUMBER = "9848988463";
const FROM = process.env.EMAIL_FROM ?? "Finora <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** Escapes user-controlled strings before HTML interpolation. */
function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sends an email; never throws — email failures must not break the app flow. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = client();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email:", opts.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: REPLY_TO,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) console.error("Resend error:", error.message);
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

/* ------------------------------ Template shell ------------------------------ */

function shell(title: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#1e2454;border-radius:12px 12px 0 0;padding:20px 28px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;">F<span style="color:#ee2a67;">i</span>nora</span>
      <span style="color:#9aa0c3;font-size:11px;margin-left:8px;">Your Personal Financial Command Center</span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px;color:#2a2f45;font-size:14px;line-height:1.65;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#1e2454;">${title}</h2>
      ${body}
    </div>
    <p style="text-align:center;color:#8a8fa8;font-size:11px;margin-top:16px;">
      Finora · This is an automated message
    </p>
  </div>
</body>
</html>`;
}

const whatsappLine = `
  <p style="margin-top:20px;padding:12px 16px;background:#f0fdf6;border-radius:8px;border:1px solid #c7ecd8;">
    💬 Anything urgent? Message us on WhatsApp anytime:
    <a href="https://wa.me/977${WHATSAPP_NUMBER}" style="color:#128c7e;font-weight:600;">${WHATSAPP_NUMBER}</a>
  </p>`;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://finoraypf.vercel.app";
const UPGRADE_URL = `${SITE_URL}/upgrade`;

/** Big, tappable CTA button that lands on the upgrade page. */
function ctaButton(label: string, href: string = UPGRADE_URL) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center" bgcolor="#ee2a67" style="border-radius:10px;">
      <a href="${href}"
         style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;
                color:#ffffff;text-decoration:none;border-radius:10px;">
        ${label}
      </a>
    </td></tr>
  </table>
  <p style="font-size:12px;color:#8a8fa8;margin:-12px 0 0;">
    Or open: <a href="${href}" style="color:#6b7194;">${href}</a>
  </p>`;
}

/** What premium unlocks — reused across upgrade-focused emails. */
const premiumBullets = `
  <ul style="padding-left:18px;margin:14px 0;line-height:1.9;">
    <li><b>Loans &amp; EMI</b> — full amortization schedule, interest split, due reminders</li>
    <li><b>Investments</b> — FD, shares, gold, crypto with live ROI</li>
    <li><b>Budgets</b> — monthly limits with 90% early warnings</li>
    <li><b>Unlimited accounts</b> — every bank, wallet and cash source</li>
    <li><b>Full history + reports</b> — export to Excel or PDF anytime</li>
  </ul>`;

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly (30 days)",
  half_yearly: "6 Months (180 days)",
  yearly: "1 Year (365 days)",
  lifetime: "Lifetime",
};

/* ------------------------------ Billing emails ------------------------------ */

export async function sendUpgradeRequestEmails(req: {
  fullName: string;
  email: string;
  phone: string;
  plan: string;
  payMethod: string;
}) {
  const planLabel = PLAN_LABELS[req.plan] ?? req.plan;
  const method = req.payMethod.replace(/_/g, " ");

  await Promise.all([
    // Admin alert
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `💰 New upgrade request — ${req.fullName} (${planLabel})`,
      html: shell(
        "New payment to verify",
        `<p><b>${esc(req.fullName)}</b> submitted a payment for the <b>${planLabel}</b> plan.</p>
         <table style="font-size:14px;border-collapse:collapse;">
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">Email</td><td>${esc(req.email)}</td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">WhatsApp</td><td>${esc(req.phone)}</td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">Paid via</td><td style="text-transform:capitalize;">${esc(method)}</td></tr>
         </table>
         <p style="margin-top:16px;">Open the <b>Admin panel → Pending requests</b> to view the screenshot and approve.</p>`,
      ),
    }),
    // Client confirmation
    sendEmail({
      to: req.email,
      subject: "✅ Your Finora upgrade request has been received",
      html: shell(
        `Thank you, ${esc(req.fullName.split(" ")[0])}!`,
        `<p>Your upgrade request for the <b>${planLabel}</b> plan has been successfully submitted.</p>
         <p>Please wait a few minutes to a few hours — we verify every payment manually,
         and your premium credits will be added as soon as it's confirmed. We will contact you soon.</p>
         ${whatsappLine}`,
      ),
    }),
  ]);
}

export async function sendUpgradeReviewedEmail(req: {
  fullName: string;
  email: string;
  plan: string;
  approved: boolean;
  points?: number | null;
}) {
  const planLabel = PLAN_LABELS[req.plan] ?? req.plan;
  const firstName = req.fullName.split(" ")[0];

  if (req.approved) {
    const pointsLine =
      req.plan === "lifetime"
        ? "You now have <b>lifetime access</b> — no credits, no expiry, ever."
        : `<b>${req.points} credits</b> (${req.points} days of premium) have been added to your account.`;
    await sendEmail({
      to: req.email,
      subject: "🎉 Your Finora premium is now active!",
      html: shell(
        `Welcome to Premium, ${esc(firstName)}!`,
        `<p>Your payment for the <b>${planLabel}</b> plan has been verified.</p>
         <p>${pointsLine}</p>
         <p>Everything is unlocked: full history, budgets, loans, investments, reports and exports. Enjoy!</p>
         ${whatsappLine}`,
      ),
    });
  } else {
    await sendEmail({
      to: req.email,
      subject: "About your Finora upgrade request",
      html: shell(
        `Hi ${esc(firstName)},`,
        `<p>We couldn't verify your payment for the <b>${planLabel}</b> plan, so the request was not approved.</p>
         <p>If you believe this is a mistake, please reach out — we'll sort it out quickly.</p>
         ${whatsappLine}`,
      ),
    });
  }
}

/* ------------------------------ Reminder emails ------------------------------ */

export async function sendEmiReminderEmail(opts: {
  email: string;
  fullName: string | null;
  lender: string;
  emiAmount: number | null;
  dueDate: string;
  outstanding: number;
  urgent?: boolean;
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  const urgent = opts.urgent === true;
  const banner = urgent
    ? `<p style="margin:0 0 14px;padding:10px 14px;background:#fee2e2;border-radius:8px;
         border:1px solid #fca5a5;color:#b91c1c;font-weight:700;">
         ⚠️ URGENT — your EMI is due TOMORROW. Please pay on time to avoid late fees.
       </p>`
    : "";
  await sendEmail({
    to: opts.email,
    subject: urgent
      ? `⚠️ URGENT: EMI due tomorrow — ${opts.lender}`
      : `⏰ EMI reminder — ${opts.lender} due ${opts.dueDate}`,
    html: shell(
      urgent
        ? `Hi ${esc(name)}, your EMI is due tomorrow`
        : `Hi ${esc(name)}, your EMI is coming up`,
      `${banner}
       <p>Your loan payment for <b>${esc(opts.lender)}</b> is due on <b>${opts.dueDate}</b>.</p>
       <table style="font-size:14px;border-collapse:collapse;">
         ${
           opts.emiAmount != null
             ? `<tr><td style="padding:4px 16px 4px 0;color:#6b7194;">EMI amount</td><td><b>${formatMoney(opts.emiAmount)}</b></td></tr>`
             : ""
         }
         <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">Outstanding</td><td>${formatMoney(opts.outstanding)}</td></tr>
       </table>
       <p style="margin-top:16px;">Record the payment in Finora once it's done — we'll split the
       interest and principal for you automatically.</p>`,
    ),
  });
}

export async function sendBudgetExceededEmail(opts: {
  email: string;
  fullName: string | null;
  category: string;
  spent: number;
  budget: number;
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  await sendEmail({
    to: opts.email,
    subject: `⚠️ Budget exceeded — ${opts.category}`,
    html: shell(
      `Hi ${esc(name)}, you've gone over budget`,
      `<p>Your <b>${esc(opts.category)}</b> spending this month is
       <b>${formatMoney(opts.spent)}</b>, over your budget of
       ${formatMoney(opts.budget)}.</p>
       <p>Open Finora to see where it went and adjust before month-end.</p>`,
    ),
  });
}

export async function sendLowPointsEmail(opts: {
  email: string;
  fullName: string | null;
  points: number;
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  const n = opts.points;
  const dayWord = n === 1 ? "day" : "days";
  const last = n === 1;

  const subject = last
    ? `⏳ Last day — don't lose your budgets, loans & reports`
    : `⏳ ${n} ${dayWord} left on your Finora premium`;

  const urgencyLine = last
    ? `<p style="margin:0 0 14px;padding:10px 14px;background:#fff4e5;border-radius:8px;
         border:1px solid #ffd8a8;color:#9a5b00;font-weight:700;">
         This is your final day of premium access.
       </p>`
    : "";

  await sendEmail({
    to: opts.email,
    subject,
    html: shell(
      last
        ? `${esc(name)}, your premium ends today`
        : `${esc(name)}, ${n} ${dayWord} of premium left`,
      `${urgencyLine}
       <p>You've been building a real picture of your money — and tomorrow
       ${last ? "" : "soon "}that picture goes quiet.</p>

       <p><b>When your credits run out you'll lose access to:</b></p>
       ${premiumBullets}

       <p>Your data is <b>never deleted</b> — every transaction stays exactly
       where it is. It just becomes read-only until you top up, and everything
       unlocks again the moment you do.</p>

       <p style="padding:12px 16px;background:#f5f6fb;border-radius:8px;">
         A month of premium is <b>${formatMoney(500)}</b> — about
         <b>${formatMoney(17)} a day</b>, less than a cup of tea. One expense
         you catch pays for the whole month.
       </p>

       ${ctaButton(last ? "Keep my premium — top up now" : "Top up and keep going")}

       ${whatsappLine}`,
    ),
  });
}

/**
 * Nudge for free users who've stuck with the app for a week — they have the
 * habit, so show them what the paid tier adds.
 */
export async function sendFreeUserPromoEmail(opts: {
  email: string;
  fullName: string | null;
  daysUsing: number;
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  await sendEmail({
    to: opts.email,
    subject: `${esc(name)}, you've tracked for ${opts.daysUsing} days — here's what's next`,
    html: shell(
      `Nice work, ${esc(name)} 👏`,
      `<p>You've been tracking your money in Finora for
       <b>${opts.daysUsing} days</b>. Most people quit in the first week —
       you didn't. That habit is the hard part, and it's done.</p>

       <p>Right now you're seeing only a slice of the picture: your latest
       few transactions. <b>Premium opens the rest:</b></p>
       ${premiumBullets}

       <p>That's the difference between <i>writing down</i> what you spent and
       actually <b>seeing where your money goes</b> — which loan is costing
       you most, which category quietly eats your salary, and how much you
       could be saving each month.</p>

       <p style="padding:12px 16px;background:#f5f6fb;border-radius:8px;">
         Plans start at <b>${formatMoney(500)}/month</b> (≈
         ${formatMoney(17)} a day). Pay once via eSewa, Khalti or bank —
         no auto-renewal, no card saved, cancel by simply not topping up.
       </p>

       ${ctaButton("Unlock everything — see plans")}

       <p style="font-size:13px;color:#6b7194;">Not ready? No problem — the
       free plan stays free, and your data is always yours.</p>

       ${whatsappLine}`,
    ),
  });
}

export async function sendMaturityReminderEmail(opts: {
  email: string;
  fullName: string | null;
  investmentName: string;
  maturesOn: string;
  currentValue: number;
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  await sendEmail({
    to: opts.email,
    subject: `📈 Investment maturing — ${opts.investmentName} on ${opts.maturesOn}`,
    html: shell(
      `Hi ${esc(name)}, an investment is maturing`,
      `<p>Your investment <b>${esc(opts.investmentName)}</b> matures on <b>${opts.maturesOn}</b>.</p>
       <p>Current recorded value: <b>${formatMoney(opts.currentValue)}</b></p>
       <p>Don't forget to update its final value in Finora, or roll it into a new investment.</p>`,
    ),
  });
}
