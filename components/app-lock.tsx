"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LogoMark } from "@/components/logo";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPin, PIN_KEY, UNLOCK_KEY } from "@/lib/pin";

/** "locked" only when a PIN is set and this session isn't unlocked. */
function useLockStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      const hash = localStorage.getItem(PIN_KEY);
      const unlocked = sessionStorage.getItem(UNLOCK_KEY) === "1";
      return !hash || unlocked ? "open" : "locked";
    },
    () => "open",
  );
}

export function AppLock({ children }: { children: React.ReactNode }) {
  const t = useT();
  const storeStatus = useLockStatus();
  const [unlockedNow, setUnlockedNow] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const locked = storeStatus === "locked" && !unlockedNow;

  useEffect(() => {
    if (locked) inputRef.current?.focus();
  }, [locked]);

  async function tryUnlock(event: React.FormEvent) {
    event.preventDefault();
    const hash = localStorage.getItem(PIN_KEY);
    if (hash && (await hashPin(pin)) === hash) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      setUnlockedNow(true);
      setPin("");
    } else {
      setError(true);
      setPin("");
    }
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background p-6">
      <LogoMark className="size-14" />
      <form onSubmit={tryUnlock} className="w-full max-w-xs space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t.lock.enterPin}</p>
        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          className="text-center text-2xl tracking-[0.5em]"
          placeholder="••••"
        />
        {error && <p className="text-sm text-destructive">{t.lock.wrongPin}</p>}
        <Button type="submit" className="w-full" disabled={pin.length < 4}>
          {t.lock.unlock}
        </Button>
      </form>
    </div>
  );
}
