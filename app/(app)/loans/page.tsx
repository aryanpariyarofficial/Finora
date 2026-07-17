import { Landmark } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Loans" };

export default function LoansPage() {
  return (
    <ComingSoon
      title="Loans"
      description="Track loans, EMIs and interest — fully integrated with your ledger."
      phase="Phase 2"
      icon={Landmark}
      bullets={[
        "EMI + amortization schedule calculator",
        "Interest paid vs principal remaining",
        "Next due date and payment history",
        "Loan payments post to the double-entry ledger",
      ]}
    />
  );
}
