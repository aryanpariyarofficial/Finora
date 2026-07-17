"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adjustUserPoints } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdjustPoints({ userId }: { userId: string }) {
  const [delta, setDelta] = useState("");
  const [pending, startTransition] = useTransition();

  function apply() {
    const value = parseInt(delta, 10);
    if (!Number.isInteger(value) || value === 0) {
      toast.error("Enter a non-zero number, e.g. 30 or -10");
      return;
    }
    startTransition(async () => {
      const result = await adjustUserPoints(userId, value);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`Points ${value > 0 ? "added" : "removed"}`);
        setDelta("");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        placeholder="±points"
        className="h-8 w-24 text-sm"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
      />
      <Button size="sm" variant="outline" disabled={pending} onClick={apply}>
        Apply
      </Button>
    </div>
  );
}
