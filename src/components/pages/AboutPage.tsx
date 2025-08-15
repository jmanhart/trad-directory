import React from "react";
import styles from "./AboutPage.module.css";
import HeroMessage from "./../common/HeroMessage";

const AboutPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trad Tattoo Directory</h1>
      <HeroMessage />
      <p className={styles.description}>
        Let’s face it, Instagram search fucking sucks and most artists and shops
        use Instagram to show their work. This tool isto help people keep track
        of the cool work people are doing in what will hopefully be an easy way
        to find artists when you are looking.{" "}
      </p>
      <p className={styles.description}>
        And right now, you can’t easily search by city, state or country on
        Instagram. Everything relies on word of mouth. I’ve been compiling this
        list from Reddit, my own finds on insta, and just a general appreciation
        for this art form.
      </p>
      <p className={styles.description}>
        Why only traditional? Because it’s fucking awesome, that’s why.
      </p>
    </div>
  );
};

export default AboutPage;
