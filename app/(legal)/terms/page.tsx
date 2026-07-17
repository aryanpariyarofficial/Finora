import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Finora.",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: 17 July 2026
      </p>

      <p>
        These terms govern your use of Finora, operated by UDAN Technology. By
        creating an account you agree to them.
      </p>

      <h2 className="pt-4 text-xl font-semibold">1. Your account</h2>
      <p>
        You are responsible for keeping your login secure and for the activity
        under your account. Provide accurate information and keep it up to date.
      </p>

      <h2 className="pt-4 text-xl font-semibold">2. Free and premium plans</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          The free plan lets you track income and expenses and view your data.
        </li>
        <li>
          Premium uses a points system: 1 point = 1 day of premium access.
          Points are added after we verify your payment. Lifetime plans do not
          expire.
        </li>
        <li>
          Payments are made through eSewa, Khalti or bank transfer and verified
          manually, usually within 24 hours.
        </li>
      </ul>

      <h2 className="pt-4 text-xl font-semibold">3. Payments & refunds</h2>
      <p>
        Because premium is delivered as points immediately after verification,
        payments are generally non-refundable. If you were charged in error or a
        payment was not activated, contact us and we will make it right.
      </p>

      <h2 className="pt-4 text-xl font-semibold">4. Referrals</h2>
      <p>
        Premium members may share a referral link. When a new user signs up
        through it, both accounts receive bonus points. Creating fake accounts,
        self-referring, or otherwise abusing the program may result in the
        removal of bonus points and account suspension.
      </p>

      <h2 className="pt-4 text-xl font-semibold">5. Not financial advice</h2>
      <p>
        Finora is a tool to record and organise your own money. It does not
        provide financial, investment, tax or legal advice. Calculations (such
        as EMI and ROI) are estimates for your convenience; verify important
        figures independently.
      </p>

      <h2 className="pt-4 text-xl font-semibold">6. Acceptable use</h2>
      <p>
        Do not misuse the service, attempt to break its security, access other
        users&apos; data, or use it for anything unlawful.
      </p>

      <h2 className="pt-4 text-xl font-semibold">7. Availability</h2>
      <p>
        We work to keep Finora available and accurate but provide it &quot;as
        is&quot; without warranties. We are not liable for losses arising from
        use of the app, to the extent permitted by law.
      </p>

      <h2 className="pt-4 text-xl font-semibold">8. Changes & termination</h2>
      <p>
        We may update these terms or the service over time. You may stop using
        Finora at any time; we may suspend accounts that violate these terms.
      </p>

      <h2 className="pt-4 text-xl font-semibold">9. Contact</h2>
      <p>
        Email{" "}
        <a
          href="mailto:aryanpariyar8463@gmail.com"
          className="font-medium text-primary underline underline-offset-4"
        >
          aryanpariyar8463@gmail.com
        </a>{" "}
        or WhatsApp{" "}
        <a
          href="https://wa.me/9779848988463"
          className="font-medium text-primary underline underline-offset-4"
        >
          9848988463
        </a>
        .
      </p>
    </>
  );
}
