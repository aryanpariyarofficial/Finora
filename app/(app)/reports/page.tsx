import { ChartColumnBig } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="Daily, weekly, monthly, yearly and custom-range reports."
      phase="Phase 2"
      icon={ChartColumnBig}
      bullets={[
        "Income vs expense, savings and net worth trends",
        "Monthly comparison and top categories",
        "PDF / Excel / CSV export",
        "Custom date-range reports",
      ]}
    />
  );
}
