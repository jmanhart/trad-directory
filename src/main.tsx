import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { initSentry } from "./utils/sentry.ts";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./styles/variables.css";
import "./styles/globals.css";

// Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>
);
