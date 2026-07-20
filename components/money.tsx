"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@/lib/finance";
import { Button } from "@/components/ui/button";

const KEY = "finora-hide-amounts";
const listeners = new Set<() => void>();

// Amounts are hidden BY DEFAULT (bank-app style). Only an explicit "0"
// (the user tapped the eye to reveal) shows them.
function getSnapshot() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) !== "0";
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Whether money amounts are currently masked on this device. */
export function useMoneyHidden() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function toggleMoneyHidden() {
  // hidden → "0" (show); shown → "1" (hide).
  localStorage.setItem(KEY, getSnapshot() ? "0" : "1");
  listeners.forEach((l) => l());
}

/** Small inline eye toggle to sit right next to an amount. */
export function MoneyEye({ className }: { className?: string }) {
  const hidden = useMoneyHidden();
  return (
    <button
      type="button"
      aria-label={hidden ? "Show amount" : "Hide amount"}
      onClick={toggleMoneyHidden}
      className={
        "inline-flex text-muted-foreground transition-colors hover:text-foreground " +
        (className ?? "")
      }
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

/**
 * Renders a money amount, masked as •••• when the user has hidden amounts.
 * Use everywhere a balance/amount is shown so the privacy toggle is global.
 */
export function Money({
  value,
  signed,
  compact,
  currency,
}: {
  value: number;
  signed?: boolean;
  compact?: boolean;
  currency?: string;
}) {
  const hidden = useMoneyHidden();
  if (hidden) {
    return (
      <span className="select-none tracking-wider" aria-label="hidden">
        Rs. xxx
      </span>
    );
  }
  return <>{formatMoney(value, { signed, compact, currency })}</>;
}

/** Header eye toggle for hiding/showing all amounts. */
export function MoneyToggle() {
  const hidden = useMoneyHidden();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      onClick={toggleMoneyHidden}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}
