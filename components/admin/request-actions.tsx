"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Download, Eye, Loader2, X } from "lucide-react";
import {
  getPaymentScreenshotUrl,
  reviewPaymentRequest,
} from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RequestActions({
  requestId,
  plan,
  screenshotPath,
  requesterName,
}: {
  requestId: string;
  plan: string;
  screenshotPath: string;
  requesterName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  function review(action: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewPaymentRequest(requestId, action, plan);
      if (result?.error) toast.error(result.error);
      else
        toast.success(
          action === "approved" ? "Approved — points added" : "Rejected",
        );
    });
  }

  async function openProof() {
    setProofOpen(true);
    if (proofUrl) return;
    setLoadingProof(true);
    const result = await getPaymentScreenshotUrl(screenshotPath);
    setLoadingProof(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setProofOpen(false);
    } else if ("url" in result && result.url) {
      setProofUrl(result.url);
    }
  }

  async function download() {
    if (!proofUrl) return;
    try {
      const res = await fetch(proofUrl);
      const blob = await res.blob();
      const ext = (screenshotPath.split(".").pop() ?? "png").split("?")[0];
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `payment-proof-${requesterName ?? requestId}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Could not download the image.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={openProof}>
          <Eye className="size-3.5" /> Proof
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

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Payment proof{requesterName ? ` — ${requesterName}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-64 items-center justify-center rounded-lg border bg-muted/40 p-2">
            {loadingProof || !proofUrl ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <Image
                src={proofUrl}
                alt="Payment screenshot"
                width={800}
                height={1000}
                unoptimized
                className="h-auto max-h-[70vh] w-auto rounded-md object-contain"
              />
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={!proofUrl}
            onClick={download}
          >
            <Download className="size-4" /> Download proof
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
