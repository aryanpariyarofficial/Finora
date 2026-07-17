"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import {
  getPaymentScreenshotUrl,
  reviewPaymentRequest,
} from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

export function RequestActions({
  requestId,
  plan,
  screenshotPath,
}: {
  requestId: string;
  plan: string;
  screenshotPath: string;
}) {
  const [pending, startTransition] = useTransition();

  function review(action: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewPaymentRequest(requestId, action, plan);
      if (result?.error) toast.error(result.error);
      else toast.success(action === "approved" ? "Approved — points added" : "Rejected");
    });
  }

  function viewScreenshot() {
    startTransition(async () => {
      const result = await getPaymentScreenshotUrl(screenshotPath);
      if ("error" in result && result.error) toast.error(result.error);
      else if ("url" in result && result.url) window.open(result.url, "_blank");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={viewScreenshot}
      >
        <ExternalLink className="size-3.5" /> Proof
      </Button>
      <Button size="sm" disabled={pending} onClick={() => review("approved")}>
        <Check className="size-3.5" /> Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => review("rejected")}
      >
        <X className="size-3.5" /> Reject
      </Button>
    </div>
  );
}
