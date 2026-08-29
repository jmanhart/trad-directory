// Shared Sentry init for the serverless backend.
//
// The per-function `Sentry.init({ dsn, environment })` used elsewhere leaves
// tracing, logs, and metrics OFF — so `startSpan` is a no-op, `logger.*` is
// dropped, and `metrics.*` never emits. This module turns all three on and is
// the single import point for the link-health workflow (cron + on-demand +
// probe) so every function is instrumented consistently.
//
// Node caches modules, so the init below runs exactly once per function
// instance. A missing SENTRY_DSN (e.g. local dev) simply disables sending —
// every Sentry call stays a safe no-op.
//
// NOTE: serverless functions are short-lived; callers MUST `await Sentry.flush()`
// before returning or buffered spans/logs/metrics/errors may never send.

import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  // Capture every trace — the link-health workflow is low volume (a few dozen
  // probes per cron tick), so 100% sampling costs nothing meaningful and makes
  // trace-based metrics complete.
  tracesSampleRate: 1.0,
  // Structured logs (Sentry.logger.*).
  enableLogs: true,
});

export { Sentry };
