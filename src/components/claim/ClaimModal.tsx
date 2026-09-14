import { useState } from "react";
import { Button } from "../common/FormComponents";
import { ModalShell } from "../common/ModalShell";
import InstagramIcon from "../../assets/icons/instagramIcon";
import {
  DIRECTORY_INSTAGRAM_DM_URL,
  DIRECTORY_INSTAGRAM_HANDLE,
} from "../../lib/brand";
import shellStyles from "../common/ModalShell/ModalShell.module.css";
import styles from "./ClaimModal.module.css";

export type ClaimModalStep = "intro" | "code";

export interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: ClaimModalStep;
  listingName: string;
  /** Instagram handle on the listing (without leading @), if any. */
  handle?: string | null;
  /** The issued verification code; null before a claim is started. */
  code: string | null;
  /** Begin verification: issue a code and move to the code step. */
  onStart: () => void;
  /** Issue a fresh code, invalidating the previous one. */
  onRegenerate: () => void;
  /** Abandon the in-progress claim. */
  onCancelClaim: () => void;
}

export default function ClaimModal({
  isOpen,
  onClose,
  step,
  listingName,
  handle,
  code,
  onStart,
  onRegenerate,
  onCancelClaim,
}: ClaimModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure context / permissions) — no-op; the code
      // is visible on screen to copy by hand.
    }
  };

  const title = step === "intro" ? "Claim this listing" : "Verify on Instagram";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title}>
      {step === "intro" ? (
        <div className={styles.body}>
          <p className={styles.lead}>
            Claim <strong>{listingName}</strong> to confirm you run this listing
            and manage how it appears in the directory.
          </p>

          {handle ? (
            <p className={styles.handleLine}>
              Instagram on file: <strong>@{handle}</strong>
            </p>
          ) : (
            <p className={styles.note}>
              This listing has no Instagram handle on file yet — start a claim
              and we'll sort verification out with you directly.
            </p>
          )}

          <ul className={styles.unlockList}>
            <li>A “Verified owner” badge on your listing</li>
            <li>Keep your name, handle, and location accurate</li>
            <li>Say how you show up across the directory</li>
          </ul>

          <div className={shellStyles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Not now
            </Button>
            <Button type="button" variant="primary" onClick={onStart}>
              Start verification
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <p className={styles.lead}>
            DM this code to{" "}
            <a
              className={styles.igLink}
              href={DIRECTORY_INSTAGRAM_DM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{DIRECTORY_INSTAGRAM_HANDLE}
            </a>{" "}
            on Instagram, from{" "}
            <strong>
              {handle ? `@${handle}` : "the account you're claiming"}
            </strong>
            .
          </p>

          <div className={styles.codeRow}>
            <code className={styles.code}>{code}</code>
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopy}
              aria-label="Copy code"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className={styles.expiryRow}>
            <span className={styles.expiryNote}>Expires in ~24 hours</span>
            <button
              type="button"
              className={styles.linkButton}
              onClick={onRegenerate}
            >
              Regenerate code
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            icon={<InstagramIcon />}
            onClick={() =>
              window.open(
                DIRECTORY_INSTAGRAM_DM_URL,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Open Instagram DM
          </Button>

          <p className={styles.note}>
            We'll confirm and approve within about a day, and email you when
            it's done.
          </p>

          <div className={shellStyles.modalFooter}>
            <Button type="button" variant="ghost" onClick={onCancelClaim}>
              Cancel claim
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
