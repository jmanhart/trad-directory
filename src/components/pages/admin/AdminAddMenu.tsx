import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminAddMenu.module.css";

const ITEMS: { label: string; path: string }[] = [
  { label: "Artist", path: "/admin/add-artist" },
  { label: "Country", path: "/admin/add-country" },
  { label: "City", path: "/admin/add-city" },
  { label: "Tattoo Shop", path: "/admin/add-shop" },
];

interface AdminAddMenuProps {
  /** Icon-only button for the collapsed sidebar rail. */
  collapsed?: boolean;
  /** Where the menu opens relative to the button. */
  direction?: "up" | "down";
}

export default function AdminAddMenu({
  collapsed = false,
  direction = "up",
}: AdminAddMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.addButton} ${collapsed ? styles.collapsed : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Add item"
      >
        <span className={styles.plus}>+</span>
        {!collapsed && <span>Add Item</span>}
      </button>
      {open && (
        <div
          className={`${styles.menu} ${
            direction === "down" ? styles.menuDown : styles.menuUp
          }`}
        >
          {ITEMS.map(item => (
            <button
              key={item.path}
              type="button"
              className={styles.menuItem}
              onClick={() => go(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
