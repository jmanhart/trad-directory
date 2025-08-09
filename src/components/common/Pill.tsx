import React from "react";
import styles from "./Pill.module.css";

interface PillProps {
  label: string;
  count: number;
  onClick?: () => void;
}

const Pill: React.FC<PillProps> = ({ label, count, onClick }) => {
  return (
    <button type="button" className={styles.pill} onClick={onClick}>
      <span className={styles.label}>{label}</span>
      <span className={styles.count}>{count}</span>
    </button>
  );
};

export default Pill;
