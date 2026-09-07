import { useEffect, useRef } from "react";
import { getFeedback } from "@sentry/react";
import styles from "./FeedbackButton.module.css";

/**
 * Map-only feedback trigger, pinned top-right. Opens the themed Sentry feedback
 * form (anchored near this button via --dialog-inset in globals.css). Rendered
 * only on the map view.
 */
export default function FeedbackButton() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const feedback = getFeedback();
    if (!feedback || !ref.current) return;
    // attachTo wires a click handler that opens the form; returns an unsubscribe.
    return feedback.attachTo(ref.current);
  }, []);

  return (
    <button ref={ref} type="button" className={styles.feedbackButton}>
      Got Feedback?
    </button>
  );
}
