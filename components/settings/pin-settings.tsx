"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPin, PIN_KEY, UNLOCK_KEY } from "@/lib/pin";
import { useSyncExternalStore } from "react";

function usePinSet() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => localStorage.getItem(PIN_KEY) != null,
    () => false,
  );
}

export function PinSettings() {
  const t = useT();
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const hydratedPinSet = usePinSet();
  const isSet = pinSet ?? hydratedPinSet;
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");

  async function save() {
    if (pin.length < 4) {
      toast.error(t.lock.tooShort);
      return;
    }
    if (pin !== confirm) {
      toast.error(t.lock.mismatch);
      return;
    }
    localStorage.setItem(PIN_KEY, await hashPin(pin));
    sessionStorage.setItem(UNLOCK_KEY, "1");
    setPin("");
    setConfirm("");
    setPinSet(true);
    toast.success(t.lock.pinSet);
  }

  function remove() {
    localStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
    setPinSet(false);
    toast.success(t.lock.pinRemoved);
  }

  if (isSet) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-[var(--success)]">
          <ShieldCheck className="size-4" /> {t.lock.pinActive}
        </p>
        <Button variant="outline" size="sm" onClick={remove}>
          {t.lock.removePin}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xs space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pin">{t.lock.newPin}</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="4–8 digits"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin2">{t.lock.confirmPin}</Label>
        <Input
          id="pin2"
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button onClick={save} disabled={pin.length < 4}>
        <LockKeyhole className="size-4" /> {t.lock.setPin}
      </Button>
    </div>
  );
}
