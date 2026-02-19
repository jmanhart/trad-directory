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

console.info(
  "%cSo you like traditional tattoos and code? 🤝\n%cCome say hi → https://github.com/jmanhart/trad-directory",
  "font-size:16px;font-weight:bold;color:#e74c3c;",
  "font-size:13px;color:#3498db;"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>
);
