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
        `<p><b>${req.fullName}</b> submitted a payment for the <b>${planLabel}</b> plan.</p>
         <table style="font-size:14px;border-collapse:collapse;">
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">Email</td><td>${req.email}</td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">WhatsApp</td><td>${req.phone}</td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7194;">Paid via</td><td style="text-transform:capitalize;">${method}</td></tr>
         </table>
         <p style="margin-top:16px;">Open the <b>Admin panel → Pending requests</b> to view the screenshot and approve.</p>`,
      ),
    }),
    // Client confirmation
    sendEmail({
      to: req.email,
      subject: "✅ Your Finora upgrade request has been received",
      html: shell(
        `Thank you, ${req.fullName.split(" ")[0]}!`,
        `<p>Your upgrade request for the <b>${planLabel}</b> plan has been successfully submitted.</p>
         <p>Please wait a few minutes to a few hours — we verify every payment manually,
         and your premium points will be added as soon as it's confirmed. We will contact you soon.</p>
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
        ? "You now have <b>lifetime access</b> — no points, no expiry, ever."
        : `<b>${req.points} points</b> (${req.points} days of premium) have been added to your account.`;
    await sendEmail({
      to: req.email,
      subject: "🎉 Your Finora premium is now active!",
      html: shell(
        `Welcome to Premium, ${firstName}!`,
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
        `Hi ${firstName},`,
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
}) {
  const name = opts.fullName?.split(" ")[0] ?? "there";
  await sendEmail({
    to: opts.email,
    subject: `⏰ EMI reminder — ${opts.lender} due ${opts.dueDate}`,
    html: shell(
      `Hi ${name}, your EMI is coming up`,
      `<p>Your loan payment for <b>${opts.lender}</b> is due on <b>${opts.dueDate}</b>.</p>
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
      `Hi ${name}, an investment is maturing`,
      `<p>Your investment <b>${opts.investmentName}</b> matures on <b>${opts.maturesOn}</b>.</p>
       <p>Current recorded value: <b>${formatMoney(opts.currentValue)}</b></p>
       <p>Don't forget to update its final value in Finora, or roll it into a new investment.</p>`,
    ),
  });
}
