import React from "react";
import styles from "./AboutPage.module.css";
import HeroMessage from "./../common/HeroMessage";

const AboutPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trad Tattoo Directory</h1>
      <HeroMessage />
      <p className={styles.description}>
        Welcome to the Trad Tattoo Directory, the ultimate resource for
        discovering and connecting with the best traditional tattoo artists and
        shops around the world. Whether you're searching for an artist in your
        city or exploring the globe, we've got you covered. This is very much a
        work in progress and will be adding artists and shops every day.
      </p>
      <h2 className={styles.subtitle}>Goal</h2>
      <ul className={styles.list}>
        <li>📍 Find artists by location: city, state, or country.</li>
        <li>🎨 Explore profiles of traditional tattoo artists.</li>
        <li>🏢 Discover shops and see the artists who work there.</li>
        <li>🔍 Search by Instagram handle or artist name.</li>
      </ul>
    </div>
  );
};

export default AboutPage;
