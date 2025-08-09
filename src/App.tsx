import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/pages/HomePage";
import Header from "./components/common/Header";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/shop/ShopPage";
import LogoTypePlayground from "./components/logo/LogoTypePlayground";
// import ShopList from "./components/shop/ShopList";
import styles from "./App.module.css"; // Import your CSS for styling
import { Sentry } from "./utils/sentry";

// Enhanced App component with Sentry error boundary
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: ({ error, componentStack, resetError }) => (
    <div className={styles.errorBoundary}>
      <h2>Something went wrong</h2>
      <p>We've been notified and are working to fix this issue.</p>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
        <pre>{componentStack}</pre>
      </details>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
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
            <Route path="/logo-type" element={<LogoTypePlayground />} />
            {/* Dynamic Route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default SentryApp;
