import { Link, useNavigate } from "react-router-dom";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { getShopUrl } from "../../services/api";
import GlobeIcon from "../../assets/icons/globeIcon";
import { Button } from "../common/FormComponents";
import styles from "./ShopCard.module.css";

interface ShopCardProps {
  shop: {
    id: number;
    shop_name: string;
    slug?: string | null;
    instagram_handle?: string | null;
    city_name?: string;
    state_name?: string;
    country_name?: string;
  };
}

export default function ShopCard({ shop }: ShopCardProps) {
  const navigate = useNavigate();
  const shopUrl = getShopUrl(shop);
  const instagramUrl = shop.instagram_handle
    ? `https://www.instagram.com/${shop.instagram_handle}`
    : null;

  const locationString = formatArtistLocation({
    city_name: shop.city_name,
    state_name: shop.state_name,
    country_name: shop.country_name,
    is_traveling: false,
  });

  return (
    <Link to={shopUrl} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.shopName}>{shop.shop_name}</h3>
            {shop.instagram_handle && (
              <a
                className={styles.instagramLink}
                href={instagramUrl!}
                target="_blank"
                rel="noreferrer noopener"
                onClick={e => e.stopPropagation()}
              >
                @{shop.instagram_handle}
              </a>
            )}
            {locationString && (
              <div className={styles.locationLine}>
                <GlobeIcon className={styles.locationIcon} aria-hidden />
                <span className={styles.locationValue}>{locationString}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            navigate(shopUrl);
          }}
        >
          View Shop
        </Button>
      </div>
    </Link>
  );
}
