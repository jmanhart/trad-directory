import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/pages/HomePage";
import Header from "./components/common/Header";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/shop/ShopPage";
import SearchResults from "./components/pages/SearchResults";
import LogoTypePlayground from "./components/logo/LogoTypePlayground";
import styles from "./App.module.css";
import { Sentry } from "./utils/sentry";
import ArtistPage from "./components/pages/ArtistPage";
import LoginPage from "./components/auth/LoginPage";
import AuthCallback from "./components/auth/AuthCallback";
import RequireAuth from "./components/auth/RequireAuth";
import SavedPage from "./components/pages/SavedPage";
import AccountPage from "./components/pages/AccountPage";

// Enhanced App component with Sentry error boundary
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: ({ error, componentStack, resetError }) => {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div className={styles.errorBoundary}>
        <h2>Something went wrong</h2>
        <p>We've been notified and are working to fix this issue.</p>
        <details>
          <summary>Error details</summary>
          <pre>{message}</pre>
          <pre>{componentStack}</pre>
        </details>
        <button onClick={resetError}>Try again</button>
      </div>
    );
  },
  onError: (error, componentStack) => {
    console.error("App error boundary caught an error:", error, componentStack);
  },
});

function App() {
  return (
    <Router>
      <div className={styles.appContainer}>
        <Header />
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/shops" element={<ShopPage />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/logo-type" element={<LogoTypePlayground />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/saved"
              element={
                <RequireAuth>
                  <SavedPage />
                </RequireAuth>
              }
            />
            <Route
              path="/account"
              element={<AccountPage />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default SentryApp;
