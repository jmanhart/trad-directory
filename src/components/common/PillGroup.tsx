import React from "react";
import Pill from "./Pill";
import styles from "./PillGroup.module.css";

interface PillData {
  label: string;
  count?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
  key?: string | number;
}

interface PillGroupProps {
  title?: string;
  items: PillData[];
}

export default function PillGroup({ title, items }: PillGroupProps) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.group}>
        {items.map((item, index) => (
          <Pill
            key={item.key ?? item.label ?? index}
            label={item.label}
            count={item.count}
            onClick={item.onClick}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
}
