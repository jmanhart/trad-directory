import React from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** Optional count shown as a small badge when > 0 */
  badge?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={`${styles.tabs} ${className || ""}`}>
      {items.map(item => {
        const isActive = activeTab === item.id;
        const showBadge = item.badge != null && item.badge > 0;
        return (
          <button
            key={item.id}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            data-active={isActive}
            onClick={() => !item.disabled && onTabChange(item.id)}
            disabled={item.disabled}
            type="button"
          >
            {item.label}
            {showBadge && (
              <span className={styles.badge} aria-label={`${item.badge} new`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
