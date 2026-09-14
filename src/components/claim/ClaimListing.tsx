import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { flags } from "../../lib/flags";
import ClaimModal from "./ClaimModal";
import {
  generateClaimCode,
  readClaimStatusOverride,
  type ClaimEntityType,
  type ClaimStatus,
} from "./claim";
import styles from "./ClaimListing.module.css";

export interface ClaimListingProps {
  entityType: ClaimEntityType;
  entityId: number;
  listingName: string;
  /** Instagram handle on the listing (without leading @), if any. */
  instagramHandle?: string | null;
}

/**
 * Phase-0 experience prototype: the public "claim your listing" entry point.
 * Renders a claim button / ownership badge near a listing's name and drives
 * the verification modal. Everything is MOCK — claim status is local state
 * seeded by a dev-only `?claim=` override; nothing is persisted. Gated by the
 * `accounts` feature flag so it's dead-code-eliminated from production until
 * the experience is wired to a backend. See CLAIM_FLOW_PLAN.md.
 */
export default function ClaimListing({
  entityType,
  entityId,
  listingName,
  instagramHandle,
}: ClaimListingProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialStatus = useMemo(
    () => readClaimStatusOverride(location.search),
    [location.search]
  );
  const [status, setStatus] = useState<ClaimStatus>(initialStatus);
  const [code, setCode] = useState<string | null>(() =>
    initialStatus === "pending" ? generateClaimCode() : null
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Public claim surface stays out of production until launch.
  if (!flags.accounts) return null;

  const openClaimFlow = () => {
    // Logged-out click → sign in, then return to this listing.
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setModalOpen(true);
  };

  const handleStart = () => {
    setCode(generateClaimCode());
    setStatus("pending");
  };

  const handleRegenerate = () => setCode(generateClaimCode());

  const handleCancelClaim = () => {
    setStatus("unclaimed");
    setCode(null);
    setModalOpen(false);
  };

  // Already verified: no claim entry, just the ownership badge.
  if (status === "verified") {
    return (
      <span className={styles.badge}>
        <span className={styles.badgeCheck} aria-hidden="true">
          ✓
        </span>
        Verified owner
      </span>
    );
  }

  return (
    <div className={styles.wrapper} data-entity={`${entityType}:${entityId}`}>
      {status === "unclaimed" && (
        <button
          type="button"
          className={styles.claimButton}
          onClick={openClaimFlow}
        >
          Is this you? Claim this listing
        </button>
      )}

      {status === "pending" && (
        <div className={styles.statusRow}>
          <span className={`${styles.pill} ${styles.pillPending}`}>
            Claim pending review
          </span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setModalOpen(true)}
          >
            View code
          </button>
        </div>
      )}

      {status === "rejected" && (
        <div className={styles.statusRow}>
          <span className={`${styles.pill} ${styles.pillRejected}`}>
            Claim declined
          </span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={openClaimFlow}
          >
            Try again
          </button>
        </div>
      )}

      <ClaimModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        step={status === "pending" ? "code" : "intro"}
        listingName={listingName}
        handle={instagramHandle}
        code={code}
        onStart={handleStart}
        onRegenerate={handleRegenerate}
        onCancelClaim={handleCancelClaim}
      />
    </div>
  );
}
