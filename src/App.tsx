import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainApp from "./components/MainApp";
import ArtistPage from "./components/ArtistPage";
import ShopPage from "./components/ShopPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/artist/:id" element={<ArtistPage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
      </Routes>
    </Router>
  );
}

export default App;
