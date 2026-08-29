// Unauthenticated Instagram existence probe.
//
// IG's public profile HTML (instagram.com/<handle>/) is a client-rendered
// shell that returns 200 for BOTH real and nonexistent handles, so it carries
// no live/dead signal. The one unauthenticated endpoint that does is the
// internal web_profile_info JSON API — called with browser-like Fetch-Metadata
// headers (x-ig-app-id + Sec-Fetch-* + a same-origin Referer); without them IG
// replies 400 "SecFetch Policy violation".
//
// Response mapping (empirically verified, 2026):
//   200 + data.user                     -> alive
//   404                                  -> dead  (freed/renamed username)
//   400 JSON {status:"fail"}             -> alive: IG *found* the profile but
//                                          couldn't serialize it (a server-side
//                                          bug for some business-category
//                                          accounts). A nonexistent handle
//                                          returns 404, never this — so a JSON
//                                          fail envelope means the profile
//                                          exists.
//   400 non-JSON (SecFetch) / 429 / 5xx  -> unknown (request rejected /
//   / timeout / anything else              throttled): NEVER flags a link.
//
// IG rate-limits per IP, so callers probe in small jittered waves. `retries`
// gives transient `unknown` results (throttle/timeout) another attempt — used
// by the on-demand Check Link, not the bulk cron.

import { Sentry } from "./sentry";

export type ProbeResult = "alive" | "dead" | "unknown";

export interface ProbeOutcome {
  result: ProbeResult;
  statusCode: number | null;
  detail: string;
}

const IG_APP_ID = "936619743392459";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function delay(ms: number): Promise<void> {
  // Plain Promise, not Promise.withResolvers() — the latter is ES2024 (Node 22+)
  // and throws on Vercel's Node 20 runtime.
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** True only when the JSON body clearly contains a populated user object. */
function hasUser(body: unknown): boolean {
  if (!body || typeof body !== "object" || !("data" in body)) return false;
  const data = body.data;
  if (!data || typeof data !== "object" || !("user" in data)) return false;
  return data.user != null;
}

/** IG's structured error envelope ({status:"fail", ...}) — the request reached
 *  profile serialization, which only happens for a profile that exists. */
function isFailEnvelope(body: unknown): boolean {
  if (!body || typeof body !== "object" || !("status" in body)) return false;
  return body.status === "fail";
}

async function doProbe(
  handle: string,
  timeoutMs: number
): Promise<ProbeOutcome> {
  const url =
    "https://www.instagram.com/api/v1/users/web_profile_info/?username=" +
    encodeURIComponent(handle);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "x-ig-app-id": IG_APP_ID,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `https://www.instagram.com/${handle}/`,
        Origin: "https://www.instagram.com",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
      },
    });
    clearTimeout(timer);

    const status = res.status;
    if (status === 404) {
      return { result: "dead", statusCode: 404, detail: "no such profile" };
    }
    if (status === 429) {
      return { result: "unknown", statusCode: 429, detail: "rate limited" };
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("json");

    if (status === 200) {
      if (!isJson) {
        return {
          result: "unknown",
          statusCode: 200,
          detail: "non-json (login wall)",
        };
      }
      const body: unknown = await res.json().catch(() => null);
      if (hasUser(body)) {
        return { result: "alive", statusCode: 200, detail: "profile ok" };
      }
      return {
        result: "unknown",
        statusCode: 200,
        detail: "json without user",
      };
    }

    if (status === 400) {
      // A JSON fail envelope means IG found the profile but its serializer
      // errored (business-category bug) -> the profile exists -> alive. A
      // non-JSON 400 is the SecFetch request rejection -> unknown.
      if (isJson) {
        const body: unknown = await res.json().catch(() => null);
        if (isFailEnvelope(body)) {
          return {
            result: "alive",
            statusCode: 400,
            detail: "profile exists (IG serializer error)",
          };
        }
        return { result: "unknown", statusCode: 400, detail: "json 400" };
      }
      return {
        result: "unknown",
        statusCode: 400,
        detail: "request rejected (400)",
      };
    }

    return {
      result: "unknown",
      statusCode: status,
      detail: `unexpected ${status}`,
    };
  } catch (e: unknown) {
    clearTimeout(timer);
    const name = e instanceof Error ? e.name : "";
    const detail =
      name === "AbortError"
        ? "timeout"
        : e instanceof Error
          ? e.message
          : "network error";
    return { result: "unknown", statusCode: null, detail };
  }
}

function recordProbeMetrics(outcome: ProbeOutcome, latencyMs: number): void {
  const status =
    outcome.statusCode == null ? "none" : String(outcome.statusCode);
  Sentry.metrics.distribution("ig.probe.latency_ms", latencyMs, {
    unit: "millisecond",
    attributes: { result: outcome.result },
  });
  Sentry.metrics.count("ig.probe", 1, {
    attributes: { result: outcome.result, status },
  });
  // Throttle / rejection signals (429, SecFetch 400, network/timeout) — the
  // thing that silently degrades the whole pulse. Alertable on its own.
  const throttled =
    outcome.result === "unknown" &&
    (outcome.statusCode === 429 ||
      outcome.statusCode === 400 ||
      outcome.statusCode === null);
  if (throttled) {
    Sentry.metrics.count("ig.throttle", 1, { attributes: { status } });
  }
}

// Span + metrics wrapper around a single probe: each Instagram request becomes
// a trace span with its latency and result, and feeds the probe/throttle
// metrics. When tracing is disabled the span is a safe no-op.
function probeOnce(handle: string, timeoutMs: number): Promise<ProbeOutcome> {
  return Sentry.startSpan(
    {
      name: "ig.probe",
      op: "http.client",
      attributes: { "ig.handle": handle },
    },
    async span => {
      const started = Date.now();
      const outcome = await doProbe(handle, timeoutMs);
      const latencyMs = Date.now() - started;
      span.setAttribute("ig.result", outcome.result);
      span.setAttribute("http.response.status_code", outcome.statusCode ?? 0);
      span.setAttribute("ig.latency_ms", latencyMs);
      recordProbeMetrics(outcome, latencyMs);
      return outcome;
    }
  );
}

export async function probeInstagram(
  handle: string,
  timeoutMs = 10000,
  retries = 0
): Promise<ProbeOutcome> {
  const h = handle.replace(/^@/, "").trim();
  if (!h)
    return { result: "unknown", statusCode: null, detail: "empty handle" };

  let outcome = await probeOnce(h, timeoutMs);
  // Retry only transient "unknown" (throttle/timeout); alive/dead are final.
  for (
    let attempt = 0;
    attempt < retries && outcome.result === "unknown";
    attempt++
  ) {
    await delay(1500 + Math.random() * 1500);
    outcome = await probeOnce(h, timeoutMs);
  }
  return outcome;
}
