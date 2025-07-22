import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import { Analytics } from "@vercel/analytics/react";

Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ||
    "https://7edc30300e65a3b770a659a6bcc98dac@o4508215900766208.ingest.us.sentry.io/4509713269260288",
  sendDefaultPii: true,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);
