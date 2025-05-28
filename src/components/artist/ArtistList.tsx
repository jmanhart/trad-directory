import type React from "react";
import ArtistCard from "./ArtistCard";
import styles from "./ArtistList.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ArtistListProps {
  artists: Artist[];
}

const ArtistList: React.FC<ArtistListProps> = ({ artists }) => {
  if (!artists.length) {
    return <p>No artists to display.</p>;
  }

  return (
    <div className={styles.list}>
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default ArtistList;
