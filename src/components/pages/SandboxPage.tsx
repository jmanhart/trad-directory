import React from "react";
import styles from "./SandboxPage.module.css";
import SandboxCard from "./SandboxCard";

export default function SandboxPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
 

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Card Component</h2>
          <div className={styles.cardGrid}>
            <SandboxCard
              title="Test Card 1"
              description="This is a test card component for styling experiments"
            />
            <SandboxCard
              title="Test Card 2"
              description="You can modify the SandboxCard component and its styles here"
            />
            <SandboxCard
              title="Test Card 3"
              description="Try different colors, spacing, shadows, and layouts"
            />
          </div>
        </div>

        
      </div>
    </div>
  );
}

