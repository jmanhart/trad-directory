import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import Header from "./components/Header";
import AboutPage from "./components/AboutPage";
import ShopPage from "./components/shop/ShopPage";
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
            {/* Dynamic Route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
