import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/pages/HomePage";
import Header from "./components/common/Header";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/shop/ShopPage";
import LogoTypePlayground from "./components/logo/LogoTypePlayground";
// import ShopList from "./components/shop/ShopList";
import styles from "./App.module.css"; // Import your CSS for styling

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

export default App;
