// Shared link-health state machine — single source of truth for how a probe
// result becomes a stored status. Used by the wave cron (checkInstagramLinks)
// and the on-demand check (checkLink) so both behave identically.
//
// Accuracy-first: a human acts on these flags, so we never brand "dead" on
// thin evidence. One dead probe -> "suspect"; only CONFIRM_DEAD_AFTER
// consecutive dead probes -> "dead". Any "alive" resets. "unknown" (throttled /
// ambiguous) never changes the verdict. "unchecked" = never reliably probed.

export type LinkStatus = "unchecked" | "alive" | "suspect" | "dead" | "unknown";

// Probe outcomes the checker can observe (from probeInstagram).
export type ProbeVerdict = "alive" | "dead" | "unknown";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const CONFIRM_DEAD_AFTER = 3;

// Re-check cadence per resulting status. `unchecked` is only ever an initial
// seed (nextState never returns it), so its value is unused but required.
export const RECHECK_MS: Record<LinkStatus, number> = {
  unchecked: 6 * HOUR,
  alive: 45 * DAY,
  suspect: 3 * DAY,
  dead: 21 * DAY,
  unknown: 6 * HOUR,
};

export interface PrevHealth {
  status: LinkStatus;
  fail_streak: number;
  last_alive_at: string | null;
}

export interface NextState {
  status: LinkStatus;
  fail_streak: number;
  last_alive_at: string | null;
  next_check_at: string;
}

export function nextState(
  prev: PrevHealth | undefined,
  probe: ProbeVerdict,
  nowIso: string,
  now: number
): NextState {
  const prevStreak = prev?.fail_streak ?? 0;
  const prevAlive = prev?.last_alive_at ?? null;

  if (probe === "alive") {
    return {
      status: "alive",
      fail_streak: 0,
      last_alive_at: nowIso,
      next_check_at: new Date(now + RECHECK_MS.alive).toISOString(),
    };
  }
  if (probe === "dead") {
    const streak = prevStreak + 1;
    const status: LinkStatus = streak >= CONFIRM_DEAD_AFTER ? "dead" : "suspect";
    return {
      status,
      fail_streak: streak,
      last_alive_at: prevAlive,
      next_check_at: new Date(now + RECHECK_MS[status]).toISOString(),
    };
  }
  // unknown: preserve prior verdict (incl. "unchecked"), retry soon.
  return {
    status: prev?.status ?? "unknown",
    fail_streak: prevStreak,
    last_alive_at: prevAlive,
    next_check_at: new Date(now + RECHECK_MS.unknown).toISOString(),
  };
}
