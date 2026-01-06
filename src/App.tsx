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
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminPage from "./components/pages/AdminPage";
import AdminAddArtist from "./components/pages/AdminAddArtist";
import AdminAddShop from "./components/pages/AdminAddShop";
import AdminAddCity from "./components/pages/AdminAddCity";
import AdminAddCountry from "./components/pages/AdminAddCountry";
import AdminAddArtistShopLink from "./components/pages/AdminAddArtistShopLink";

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
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-artist"
              element={
                <ProtectedRoute>
                  <AdminAddArtist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-shop"
              element={
                <ProtectedRoute>
                  <AdminAddShop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-city"
              element={
                <ProtectedRoute>
                  <AdminAddCity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-country"
              element={
                <ProtectedRoute>
                  <AdminAddCountry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/link-artist-shop"
              element={
                <ProtectedRoute>
                  <AdminAddArtistShopLink />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default SentryApp;
