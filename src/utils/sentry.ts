declare const __SENTRY_RELEASE__: string;

import * as Sentry from "@sentry/react";

export const initSentry = () => {
  Sentry.init({
    dsn:
      import.meta.env.VITE_SENTRY_DSN ||
      "https://7edc30300e65a3b770a659a6bcc98dac@o4508215900766208.ingest.us.sentry.io/4509713269260288",

    // 100% sampling for maximum insight (you already have this)
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Performance monitoring
    tracesSampleRate: 1.0, // Add this back for performance insights
    profilesSampleRate: 1.0, // Add profiling for React components

    environment: import.meta.env.MODE,
    debug: import.meta.env.DEV,
    release: __SENTRY_RELEASE__, // Now properly defined in vite.config.ts

    integrations: [
      // Session Replay with maximum insight
      Sentry.replayIntegration({
        // Privacy (you already have these)
        maskAllText: false,
        blockAllMedia: false,

        // Network monitoring for Supabase API
        networkDetailAllowUrls: [
          /^https:\/\/.*\.supabase\.co/, // Capture Supabase API details
          window.location.origin, // Capture your app's API calls
        ],
        networkCaptureBodies: true, // Capture request/response bodies
        networkRequestHeaders: [
          "Content-Type",
          "Accept",
          "Authorization", // If you add auth later
        ],
        networkResponseHeaders: ["Content-Type", "Content-Length"],

        // Performance monitoring
        mutationLimit: 15000, // Higher limit for complex movie UI
        mutationBreadcrumbLimit: 1000, // Warn earlier about large mutations

        // Session management
        stickySession: true, // Track across page refreshes
        minReplayDuration: 5000, // 5 seconds minimum
      }),

      // Performance monitoring
      Sentry.browserTracingIntegration({
        tracePropagationTargets: ["localhost"],
      }),

      // Profiling for React components
      Sentry.browserProfilingIntegration(),
    ],
  });
};

export const captureComponentError = (error: Error, componentName: string) => {
  Sentry.withScope((scope) => {
    scope.setTag("component", componentName);
    scope.setLevel("error");
    Sentry.captureException(error);
  });
};

export const addBreadcrumb = (
  category: string,
  message: string,
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
};
