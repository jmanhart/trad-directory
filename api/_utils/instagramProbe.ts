// Unauthenticated Instagram existence probe.
//
// IG's public profile HTML (instagram.com/<handle>/) is now a client-rendered
// shell that returns 200 for BOTH real and nonexistent handles, so it carries
// no live/dead signal. The one unauthenticated endpoint that still does is the
// internal web_profile_info JSON API — but only when called with browser-like
// Fetch-Metadata headers (x-ig-app-id + Sec-Fetch-* + a same-origin Referer);
// without them IG replies 400 "SecFetch Policy violation".
//
// Empirically verified (2026):
//   existing handle     -> 200 application/json with data.user
//   freed/renamed handle -> 404
//   everything else (400 / 429 / 5xx / non-json / timeout) is AMBIGUOUS and
//   MUST map to "unknown" — a health check never flags a link dead on doubt.
//
// IG rate-limits this endpoint hard per IP, so callers must probe in small,
// jittered waves and back off on 429/400 (see the wave scheduler).

export type ProbeResult = "alive" | "dead" | "unknown";

export interface ProbeOutcome {
  result: ProbeResult;
  statusCode: number | null;
  detail: string;
}

// Public IG web app id + a realistic desktop UA.
const IG_APP_ID = "936619743392459";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** True only when the JSON body clearly contains a populated user object. */
function hasUser(body: unknown): boolean {
  if (!body || typeof body !== "object" || !("data" in body)) return false;
  const data = body.data;
  if (!data || typeof data !== "object" || !("user" in data)) return false;
  return data.user != null;
}

export async function probeInstagram(
  handle: string,
  timeoutMs = 10000
): Promise<ProbeOutcome> {
  const h = handle.replace(/^@/, "").trim();
  if (!h) return { result: "unknown", statusCode: null, detail: "empty handle" };

  const url =
    "https://www.instagram.com/api/v1/users/web_profile_info/?username=" +
    encodeURIComponent(h);

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
        Referer: `https://www.instagram.com/${h}/`,
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
    if (status === 200) {
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        return { result: "unknown", statusCode: 200, detail: "non-json (login wall)" };
      }
      const body: unknown = await res.json().catch(() => null);
      if (hasUser(body)) {
        return { result: "alive", statusCode: 200, detail: "profile ok" };
      }
      return { result: "unknown", statusCode: 200, detail: "json without user" };
    }
    // 400 SecFetch rejection, 401/403 auth wall, 5xx: ambiguous, do not flag.
    return { result: "unknown", statusCode: status, detail: `unexpected ${status}` };
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
