import React from "react";
import styles from "./AboutPage.module.css";
import HeroMessage from "./../common/HeroMessage";

const AboutPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trad Tattoo Directory</h1>
      <HeroMessage />
      <p className={styles.description}>
        Let’s face it, Instagram search fucking sucks. Most artists and shops
        use Instagram to show their work. I’m building this tool to help people
        keep track of the cool shit people are doing in what will hopefully be
        an easy way. Right now, you can’t search 'Traditional Tattoo Artists in
        Nashville' on Instagram. Everything relies on word of mouth. I’ve been
        compiling this list from Reddit, my own finds, and a general
        appreciation for this art form.
      </p>
      <p className={styles.description}>
        Why only traditional? Because it’s fucking sick, that’s why.
      </p>
      <h2 className={styles.subtitle}>Goals</h2>
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
