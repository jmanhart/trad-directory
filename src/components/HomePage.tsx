import React from "react";
import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Welcome to the Tattoo Directory</h1>
      <p>
        Discover the best traditional tattoo artists and shops around the world.
      </p>
      <div className={styles.links}>
        <Link to="/search" className={styles.link}>
          Start Searching
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
