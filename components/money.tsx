"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@/lib/finance";
import { Button } from "@/components/ui/button";

const KEY = "finora-hide-amounts";
const listeners = new Set<() => void>();

function getSnapshot() {
  return typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
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
  const next = getSnapshot() ? "0" : "1";
  localStorage.setItem(KEY, next);
  listeners.forEach((l) => l());
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
