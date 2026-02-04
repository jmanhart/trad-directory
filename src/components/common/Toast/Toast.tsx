import React, { useEffect } from "react";
import styles from "./Toast.module.css";

export interface ToastProps {
  message: string;
  isOpen: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  isOpen,
  onDismiss,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!isOpen || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
