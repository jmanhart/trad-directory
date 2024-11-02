import { useState, useEffect } from "react";
import { fetchTattooShops } from "./services/api";
import "./App.css";

function App() {
  const [shops, setShops] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getShops() {
      try {
        const data = await fetchTattooShops();
        setShops(data);
      } catch (error: any) {
        setError("Error fetching tattoo shops.");
        console.error(error);
      }
    }

    getShops();
  }, []);

  return (
    <div className="App">
      <h1>Tattoo Shops Directory</h1>
      {error && <p>{error}</p>}
      <ul>
        {shops.map((shop: any) => (
          <li key={shop.id}>
            <strong>{shop.name}</strong> - {shop.city}, {shop.state},{" "}
            {shop.country}
            <br />
            <a
              href={`https://www.instagram.com/${shop.instagramlink}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
