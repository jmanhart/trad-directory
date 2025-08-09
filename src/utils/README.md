# Sentry Utilities

This directory contains utilities for error tracking and performance monitoring using Sentry.

## Files

- `sentry.ts` - Main Sentry configuration and utility functions

## Usage

### Basic Error Tracking

```typescript
import { captureException, addBreadcrumb } from "../utils/sentry";

// Track errors
try {
  // Some risky operation
} catch (error) {
  captureException(error as Error, {
    component: "SearchSection",
    action: "search",
  });
}

// Add breadcrumbs for debugging
addBreadcrumb("User performed search", "search", "info", {
  query: searchQuery,
  timestamp: new Date().toISOString(),
});
```

### User Context

```typescript
import { setUserContext, clearUserContext } from "../utils/sentry";

// Set user context when user logs in
setUserContext("user123", "user@example.com", "username");

// Clear user context on logout
clearUserContext();
```

### Performance Monitoring

```typescript
import { Sentry } from "../utils/sentry";

// Wrap components with Sentry performance monitoring
const SentrySearchSection = Sentry.withProfiler(SearchSection, {
  name: "SearchSection",
  includeRender: true,
  includeUpdates: true,
});
```

### Error Boundaries

```typescript
import { Sentry } from "../utils/sentry";

// Wrap your app with Sentry error boundary
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: ({ error }) => <div>Something went wrong: {error.message}</div>,
  onError: (error) => {
    console.error("App error:", error);
  },
});
```

## Configuration

The Sentry configuration is automatically initialized in `main.tsx` when the app starts. Key settings include:

- **DSN**: Configured via `VITE_SENTRY_DSN` environment variable
- **Environment**: Automatically set based on `import.meta.env.MODE`
- **Performance Monitoring**: 10% sampling rate for transactions
- **Debug Mode**: Enabled in development
- **Error Filtering**: Automatically filters out ResizeObserver errors

## Best Practices

1. **Use breadcrumbs** to track user actions and create debugging trails
2. **Set user context** when users authenticate
3. **Wrap components** with Sentry profilers for performance monitoring
4. **Use error boundaries** to catch and report React errors gracefully
5. **Filter sensitive data** in the `beforeSend` hook if needed

## Environment Variables

Make sure to set `VITE_SENTRY_DSN` in your `.env` file:

```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```
