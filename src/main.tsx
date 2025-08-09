import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Analytics } from "@vercel/analytics/react";
import { initSentry } from "./utils/sentry.ts";

// Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);
