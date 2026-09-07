import styles from "./StoreIntroModal.module.css";

interface StoreIntroModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StoreIntroModal({
  open,
  onClose,
}: StoreIntroModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-intro-title"
      >
        <h2 id="store-intro-title" className={styles.title}>
          I make no money from this
        </h2>
        <p className={styles.body}>
          This is just a jumping off point to buy straight from the artist. No
          tracking links, no data grabbing, none of that bullshit.
        </p>
        <p className={styles.note}>
          Every store here is pulled straight from the artists&rsquo; own
          BigCartel shops and collected in one spot, so you&rsquo;re not digging
          through Instagram bios to find where to buy.
        </p>
        <button type="button" className={styles.button} onClick={onClose}>
          Now buy something rad
        </button>
      </div>
    </div>
  );
}
