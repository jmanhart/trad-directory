import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./components/pages/HomePage";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/pages/ShopPage";
import SearchResults from "./components/pages/SearchResults";
import LogoTypePlayground from "./components/logo/LogoTypePlayground";
import AllArtistsPage from "./components/pages/AllArtistsPage";
import AllShopsPage from "./components/pages/AllShopsPage";
import AllCountriesPage from "./components/pages/AllCountriesPage";
import UnitedStatesMapPage from "./components/pages/UnitedStatesMapPage";
import MapPage from "./components/pages/MapPage";
import TypeTestingPage from "./components/pages/TypeTestingPage";
import styles from "./App.module.css";
import { Sentry } from "./utils/sentry";
import ArtistPage from "./components/pages/ArtistPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminPage from "./components/pages/admin/AdminPage";
import AdminAddArtist from "./components/pages/admin/AdminAddArtist";
import AdminAddShop from "./components/pages/admin/AdminAddShop";
import AdminAddCity from "./components/pages/admin/AdminAddCity";
import AdminAddCountry from "./components/pages/admin/AdminAddCountry";
import AdminAddArtistShopLink from "./components/pages/admin/AdminAddArtistShopLink";
import AdminLayout from "./components/pages/admin/AdminLayout";
import AllAnalyticsPage from "./components/pages/admin/pages/AllAnalyticsPage";
import AdminNewAdding from "./components/pages/admin/AdminNewAdding";
import AdminAllData from "./components/pages/admin/AdminAllData";
import AdminDataBuilder from "./components/pages/admin/AdminDataBuilder";
import TopAppBar from "./components/common/TopAppBar";
import AdminTopAppBar from "./components/common/AdminTopAppBar";
import Footer from "./components/common/Footer";
import { SuggestArtistModal } from "./components/common/SuggestArtistModal";
import { ToastProvider } from "./components/common/Toast";
import { usePageTracking } from "./hooks/usePageTracking";
import ScatteredSvgBackground from "./components/ScatteredSvgBackground/ScatteredSvgBackground";

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

const PAGES_WITHOUT_FOOTER = ["/artists", "/shops", "/countries", "/map"];

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMapPage = location.pathname === "/map";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isDataBuilder = location.pathname === "/admin/data-builder";
  const showFooter =
    !isAdminRoute && !PAGES_WITHOUT_FOOTER.includes(location.pathname);
  const [isAddArtistModalOpen, setIsAddArtistModalOpen] = useState(false);

  // Track page views on route changes
  usePageTracking();

  return (
    <div className={`${styles.appContainer} ${isDataBuilder ? styles.adminContainer : ""}`}>
      <ScatteredSvgBackground preset="default" intensity="subtle" />
      {isDataBuilder ? null : isAdminRoute ? (
        <AdminTopAppBar />
      ) : (
        <>
          {!isHomePage && !isMapPage && <TopAppBar />}
          <SuggestArtistModal
            isOpen={isAddArtistModalOpen}
            onClose={() => setIsAddArtistModalOpen(false)}
          />
        </>
      )}
      {showFooter && (
        <Footer
          onOpenSuggestModal={
            !isAdminRoute ? () => setIsAddArtistModalOpen(true) : undefined
          }
        />
      )}
      <main
        className={`${styles.mainContent} ${!showFooter ? styles.mainContentNoFixedFooter : ""} ${isAdminRoute ? styles.adminContent : ""} ${isDataBuilder ? styles.dataBuilderContent : ""}`}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/artists" element={<AllArtistsPage />} />
          <Route path="/shops" element={<AllShopsPage />} />
          <Route path="/countries" element={<AllCountriesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/united-states" element={<UnitedStatesMapPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/type-test" element={<TypeTestingPage />} />
          <Route path="/shop/:slugOrId" element={<ShopPage />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/logo-type" element={<LogoTypePlayground />} />
          <Route path="/artist/:slugOrId" element={<ArtistPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/admin/analytics" replace />}
            />
            <Route path="analytics" element={<AllAnalyticsPage />} />
            <Route
              path="artists"
              element={<AdminAllData embeddedTab="artists" />}
            />
            <Route
              path="shops"
              element={<AdminAllData embeddedTab="shops" />}
            />
            <Route
              path="cities"
              element={<AdminAllData embeddedTab="cities" />}
            />
            <Route
              path="countries"
              element={<AdminAllData embeddedTab="countries" />}
            />
            <Route
              path="submissions"
              element={<AdminAllData embeddedTab="new_artists" />}
            />
            <Route path="bugs" element={<AdminAllData embeddedTab="bugs" />} />
            <Route
              path="broken-links"
              element={<AdminAllData embeddedTab="broken_links" />}
            />
            <Route path="data-builder" element={<AdminDataBuilder />} />
          </Route>
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

export default SentryApp;
