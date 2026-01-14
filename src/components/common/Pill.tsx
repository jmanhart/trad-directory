import React from "react";
import styles from "./Pill.module.css";

interface PillProps {
  label: string;
  count?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function Pill({ label, count, onClick, icon }: PillProps) {
  return (
    <button type="button" className={styles.pill} onClick={onClick}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
