// Keeps your own traffic out of telemetry (Sentry session replays, Vercel
// Analytics). Two triggers:
//   1. Local/dev hosts (localhost, 127.0.0.1, *.local) are always treated as self.
//   2. A persisted opt-out flag for your own machines on prod. Client code can't
//      know its public IP, so this flag is the practical stand-in — set it once
//      per browser via ?notrack=1 (clear with ?notrack=0).
//
// This is a convenience filter, not a security boundary.

const FLAG = "td-notrack";

/**
 * Honor `?notrack=1` / `?notrack=0` and persist to localStorage. Call once, early
 * (before any telemetry init), so a fresh browser can opt out without the console.
 */
export function initTelemetryOptOut(): void {
  try {
    const param = new URLSearchParams(window.location.search).get("notrack");
    if (param === "1") localStorage.setItem(FLAG, "1");
    else if (param === "0") localStorage.removeItem(FLAG);
  } catch {
    /* localStorage or URL unavailable — nothing to persist */
  }
}

/**
 * True for traffic we don't want recorded: local dev, or a browser that has
 * opted out via the flag (your own machines).
 */
export function isSelfTraffic(): boolean {
  try {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local")
    ) {
      return true;
    }
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}
