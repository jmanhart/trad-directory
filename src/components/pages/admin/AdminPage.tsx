import { Link } from "react-router-dom";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <p className={styles.subtitle}>Select an action to continue</p>
      
      <div className={styles.buttonGrid}>
        <Link to="/admin/new-adding" className={styles.actionButton}>
          <span className={styles.buttonIcon}>➕</span>
          <span className={styles.buttonText}>New Adding</span>
        </Link>
        
        <Link to="/admin/add-artist" className={styles.actionButton}>
          <span className={styles.buttonIcon}>👤</span>
          <span className={styles.buttonText}>Add Artist</span>
        </Link>
        
        <Link to="/admin/add-shop" className={styles.actionButton}>
          <span className={styles.buttonIcon}>🏪</span>
          <span className={styles.buttonText}>Add Tattoo Shop</span>
        </Link>
        
        <Link to="/admin/add-city" className={styles.actionButton}>
          <span className={styles.buttonIcon}>🏙️</span>
          <span className={styles.buttonText}>Add City</span>
        </Link>
        
        <Link to="/admin/add-country" className={styles.actionButton}>
          <span className={styles.buttonIcon}>🌍</span>
          <span className={styles.buttonText}>Add Country</span>
        </Link>
        
        <Link to="/admin/link-artist-shop" className={styles.actionButton}>
          <span className={styles.buttonIcon}>🔗</span>
          <span className={styles.buttonText}>Link Artist / Shop</span>
        </Link>
        
        <Link to="/admin/broken-links" className={styles.actionButton}>
          <span className={styles.buttonIcon}>🔍</span>
          <span className={styles.buttonText}>Check Broken Links</span>
        </Link>
        
        <Link to="/admin/all-data" className={styles.actionButton}>
          <span className={styles.buttonIcon}>📊</span>
          <span className={styles.buttonText}>ALL DATA</span>
        </Link>
      </div>
    </div>
  );
}

