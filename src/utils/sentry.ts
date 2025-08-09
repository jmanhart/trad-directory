import * as Sentry from "@sentry/react";

// Declare global variables injected by Vite
declare global {
  // eslint-disable-next-line no-var
  var __SENTRY_RELEASE__: string;
  // eslint-disable-next-line no-var
  var __APP_VERSION__: string;
}

export function initSentry() {
  Sentry.init({
    dsn:
      import.meta.env.VITE_SENTRY_DSN ||
      "https://7edc30300e65a3b770a659a6bcc98dac@o4508215900766208.ingest.us.sentry.io/4509713269260288",
    sendDefaultPii: true,
    environment: import.meta.env.MODE,

    // Release tracking using build-time injected version
    release:
      globalThis.__SENTRY_RELEASE__ ||
      import.meta.env.VITE_APP_VERSION ||
      "0.1.0",

    // Performance monitoring - capture all traces for free plan
    tracesSampleRate: 1.0, // Capture 100% of traces

    // Session replay - capture all replays for free plan
    replaysSessionSampleRate: 1.0, // Capture 100% of session replays
    replaysOnErrorSampleRate: 1.0, // Always capture on errors

    // Debug mode in development
    debug: import.meta.env.DEV,

    // Optimize for free plan - keep more breadcrumbs
    maxBreadcrumbs: 100,

    // Before send hook for filtering sensitive data and optimizing
    beforeSend(event) {
      // Filter out certain errors if needed
      if (event.exception) {
        const exceptionValues = event.exception.values;
        if (
          exceptionValues &&
          exceptionValues.some((ev) => ev.value?.includes("ResizeObserver"))
        ) {
          return null; // Filter out ResizeObserver errors
        }

        // Filter out common development errors in production
        if (import.meta.env.MODE === "production" && exceptionValues) {
          // Filter out hot reload errors
          if (
            exceptionValues.some((ev) =>
              ev.value?.includes("Hot Module Replacement")
            )
          ) {
            return null;
          }

          // Filter out React strict mode warnings
          if (exceptionValues.some((ev) => ev.value?.includes("StrictMode"))) {
            return null;
          }
        }
      }

      // Add build information
      event.tags = {
        ...event.tags,
        build:
          globalThis.__SENTRY_RELEASE__ ||
          import.meta.env.VITE_APP_VERSION ||
          "0.1.0",
        environment: import.meta.env.MODE,
        version: globalThis.__APP_VERSION__ || "0.1.0",
      };

      return event;
    },
  });
}

// Helper function to set user context
export function setUserContext(
  userId: string,
  email?: string,
  username?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

// Helper function to clear user context
export function clearUserContext() {
  Sentry.setUser(null);
}

// Helper function to add breadcrumb
export function addBreadcrumb(
  message: string,
  category: string = "ui",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Helper function to capture exception
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    contexts: context ? { app: context } : undefined,
    tags: {
      component: (context?.component as string) || "unknown",
      action: (context?.action as string) || "unknown",
    },
  });
}

// Helper function to capture message
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.captureMessage(message, level);
}

// Helper function to set tag
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

// Helper function to set context
export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}

// Export Sentry for use in other parts of the app
export { Sentry };
