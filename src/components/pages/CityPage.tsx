import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "../../seo/Seo";
import { seoCity } from "../../../api/_seo/buildSeo";
import type { CityData } from "../../../api/_seo/fetchCity";
import styles from "./CityPage.module.css";

export default function CityPage() {
  const { slug } = useParams();
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/city/${slug}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { result: CityData }) => {
        if (cancelled) return;
        setData(j.result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading…</p>
      </div>
    );
  }
  if (notFound || !data) {
    return (
      <div className={styles.container}>
        <h1>City not found</h1>
        <p>
          <Link to="/map">Explore the map</Link> to find trad artists near you.
        </p>
      </div>
    );
  }

  const region = data.state || data.country;

  return (
    <div className={styles.container}>
      <Seo data={seoCity(data)} />
      <h1 className={styles.title}>
        Traditional Tattoo Artists in {data.city}
        {region ? `, ${region}` : ""}
      </h1>
      <p className={styles.summary}>
        {data.artists.length} artist{data.artists.length === 1 ? "" : "s"} ·{" "}
        {data.shops.length} shop{data.shops.length === 1 ? "" : "s"}
      </p>

      {data.artists.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Artists</h2>
          <ul className={styles.list}>
            {data.artists.map(a => (
              <li key={a.id}>
                <Link to={`/artist/${a.slug}`}>{a.name}</Link>
                {a.instagram ? (
                  <span className={styles.handle}>@{a.instagram}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.shops.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Shops</h2>
          <ul className={styles.list}>
            {data.shops.map(s => (
              <li key={s.id}>
                <Link to={`/shop/${s.slug}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
