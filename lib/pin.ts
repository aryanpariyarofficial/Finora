export const PIN_KEY = "finora-pin";
export const UNLOCK_KEY = "finora-unlocked";

/** SHA-256 hash of the PIN (device-local convenience lock, not a secret store). */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`finora:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
