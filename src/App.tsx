import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./components/pages/HomePage";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/pages/ShopPage";
import SearchResults from "./components/pages/SearchResults";
import LogoTypePlayground from "./components/logo/LogoTypePlayground";
import AllArtistsPage from "./components/pages/AllArtistsPage";
import AllShopsPage from "./components/pages/AllShopsPage";
import UnitedStatesMapPage from "./components/pages/UnitedStatesMapPage";
import styles from "./App.module.css";
import { Sentry } from "./utils/sentry";
import ArtistPage from "./components/pages/ArtistPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminPage from "./components/pages/admin/AdminPage";
import AdminAddArtist from "./components/pages/admin/AdminAddArtist";
import AdminAddShop from "./components/pages/admin/AdminAddShop";
import AdminAddCity from "./components/pages/admin/AdminAddCity";
import AdminAddCountry from "./components/pages/admin/AdminAddCountry";
import AdminAddArtistShopLink from "./components/pages/admin/AdminAddArtistShopLink";
import AdminBrokenLinks from "./components/pages/admin/AdminBrokenLinks";
import AdminNewAdding from "./components/pages/admin/AdminNewAdding";
import AdminAllData from "./components/pages/admin/AdminAllData";
import TopAppBar from "./components/common/TopAppBar";

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

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  
  return (
    <div className={styles.appContainer}>
      <TopAppBar />
      <main className={`${styles.mainContent} ${isHomePage ? styles.noScroll : ""}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/artists" element={<AllArtistsPage />} />
            <Route path="/shops" element={<AllShopsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/united-states" element={<UnitedStatesMapPage />} />
            <Route path="/shop/:shopId" element={<ShopPage />} />
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
            <Route
              path="/admin/broken-links"
              element={
                <ProtectedRoute>
                  <AdminBrokenLinks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/new-adding"
              element={
                <ProtectedRoute>
                  <AdminNewAdding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/all-data"
              element={
                <ProtectedRoute>
                  <AdminAllData />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default SentryApp;
