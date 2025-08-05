import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "./utils/sentry";
import App from "./App.tsx";
import { Analytics } from "@vercel/analytics/react";

// Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);
