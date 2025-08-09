import React from "react";
import Pill from "./Pill";
import styles from "./PillGroup.module.css";

interface PillData {
  label: string;
  count: number;
  onClick?: () => void;
}

interface PillGroupProps {
  title?: string;
  items: PillData[];
}

const PillGroup: React.FC<PillGroupProps> = ({ title, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.group}>
        {items.map((item) => (
          <Pill
            key={item.label}
            label={item.label}
            count={item.count}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default PillGroup;
