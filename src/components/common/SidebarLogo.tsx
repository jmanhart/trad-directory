import React from "react";
import styles from "./SidebarLogo.module.css";

interface SidebarLogoProps {
  isExpanded: boolean;
}

const SidebarLogo: React.FC<SidebarLogoProps> = ({ isExpanded }) => {
  return (
    <div className={`${styles.logoContainer} ${!isExpanded ? styles.collapsed : ""}`}>
      <p className={styles.logoText}>
        {isExpanded ? "TRAD DIRECTORY" : "TD"}
      </p>
    </div>
  );
};

export default SidebarLogo;

