import styles from "./Tabs.module.css";
import { CountBadge } from "./CountBadge";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** Optional notification-style badge when > 0 */
  badge?: number;
  /** Optional count shown as a pill next to the label */
  count?: number;
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
        const showCount = item.count != null && item.count > 0;
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
            {showCount && (
              <CountBadge count={item.count!} active={isActive} />
            )}
            {showBadge && (
              <span className={styles.badge} aria-label={`${item.badge} new`}>
                {item.badge! > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
