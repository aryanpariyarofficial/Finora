import { TrendingUp } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Investments" };

export default function InvestmentsPage() {
  return (
    <ComingSoon
      title="Investments"
      description="FD, shares, crypto, gold, mutual funds and business investments."
      phase="Phase 2"
      icon={TrendingUp}
      bullets={[
        "ROI, profit/loss and annual return",
        "Current value history and growth %",
        "Maturity date reminders",
        "Total portfolio value on the dashboard",
      ]}
    />
  );
}
