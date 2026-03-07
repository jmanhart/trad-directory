import { Link, useNavigate } from "react-router-dom";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { getShopUrl } from "../../services/api";
import GlobeIcon from "../../assets/icons/globeIcon";
import { Button } from "../common/FormComponents";
import styles from "./ShopRow.module.css";

interface ShopRowProps {
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

export default function ShopRow({ shop }: ShopRowProps) {
  const navigate = useNavigate();
  const shopUrl = getShopUrl(shop);

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
          <h3 className={styles.name}>{shop.shop_name}</h3>
          {shop.instagram_handle && (
            <span className={styles.instagramLink}>
              @{shop.instagram_handle}
            </span>
          )}
          {locationString && (
            <div className={styles.locationLine}>
              <GlobeIcon className={styles.locationIcon} aria-hidden />
              <span className={styles.locationValue}>{locationString}</span>
            </div>
          )}
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
