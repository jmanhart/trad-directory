import React from "react";
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

// import { useState, useEffect } from "react";
// import { fetchTattooShopsWithArtists } from "./services/api";
// import styles from "./App.module.css";

// interface Artist {
//   id: number;
//   name: string;
//   instagram_handle?: string;
//   shop_name?: string;
//   shop_instagram_handle?: string;
//   city_name?: string;
//   state_name?: string;
//   country_name?: string;
// }

// function App() {
//   const [artists, setArtists] = useState<Artist[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [sortConfig, setSortConfig] = useState({
//     key: "name",
//     direction: "asc",
//   });

//   useEffect(() => {
//     async function getArtists() {
//       try {
//         const data = await fetchTattooShopsWithArtists();
//         const sortedArtists = data.sort((a: Artist, b: Artist) =>
//           a.name.localeCompare(b.name)
//         );
//         setArtists(sortedArtists);
//       } catch (error: any) {
//         setError("Error fetching artists.");
//         console.error(error);
//       }
//     }

//     getArtists();
//   }, []);

//   const sortedArtists = [...artists].sort((a, b) => {
//     const aValue = a[sortConfig.key as keyof Artist];
//     const bValue = b[sortConfig.key as keyof Artist];

//     if (aValue === undefined) return 1; // Sort undefined values to the end
//     if (bValue === undefined) return -1; // Sort undefined values to the end

//     if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
//     if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
//     return 0;
//   });

//   const requestSort = (key: keyof Artist) => {
//     let direction = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const getChevron = (column: keyof Artist) => {
//     if (sortConfig.key !== column) return null;
//     return sortConfig.direction === "asc" ? "▲" : "▼";
//   };

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Artists Directory</h1>
//       {error && <p className={styles.error}>{error}</p>}

//       <table className={styles.table}>
//         <thead>
//           <tr>
//             <th onClick={() => requestSort("name")}>
//               Artist Name {getChevron("name")}
//             </th>
//             <th onClick={() => requestSort("instagram_handle")}>
//               Instagram {getChevron("instagram_handle")}
//             </th>
//             <th onClick={() => requestSort("shop_name")}>
//               Shop {getChevron("shop_name")}
//             </th>
//             <th onClick={() => requestSort("city_name")}>
//               City {getChevron("city_name")}
//             </th>
//             <th onClick={() => requestSort("state_name")}>
//               State {getChevron("state_name")}
//             </th>
//             <th onClick={() => requestSort("country_name")}>
//               Country {getChevron("country_name")}
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedArtists.map((artist) => (
//             <tr key={artist.id}>
//               <td>{artist.name}</td>
//               <td>
//                 {artist.instagram_handle ? (
//                   <a
//                     href={`https://www.instagram.com/${artist.instagram_handle}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className={styles.link}
//                   >
//                     @{artist.instagram_handle}
//                   </a>
//                 ) : (
//                   "N/A"
//                 )}
//               </td>
//               <td>
//                 {artist.shop_instagram_handle ? (
//                   <a
//                     href={`https://www.instagram.com/${artist.shop_instagram_handle}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className={styles.link}
//                   >
//                     {artist.shop_name}
//                   </a>
//                 ) : (
//                   artist.shop_name
//                 )}
//               </td>
//               <td>{artist.city_name || "N/A"}</td>
//               <td>{artist.state_name || "N/A"}</td>
//               <td>{artist.country_name || "N/A"}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default App;
