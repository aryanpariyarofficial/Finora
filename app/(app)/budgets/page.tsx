import { PiggyBank } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <ComingSoon
      title="Budgets"
      description="Set monthly limits per category and track progress."
      phase="Phase 2"
      icon={PiggyBank}
      bullets={[
        "Monthly budgets per expense category",
        "Live progress bars (18,000 / 20,000 · 90%)",
        "Budget-exceeded notifications",
        "Rollover and yearly views",
      ]}
    />
  );
}
