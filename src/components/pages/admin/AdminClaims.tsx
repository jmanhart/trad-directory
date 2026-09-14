import { useState, useEffect } from "react";
import tableStyles from "./AdminAllData.module.css";
import styles from "./AdminClaims.module.css";
import {
  CLAIM_FIXTURE_SETS,
  type ClaimFixtureSet,
  type ClaimRequest,
  type ClaimStatus,
} from "./claims.fixtures";

// Phase-0 experience prototype for the claim-your-listing review queue. Renders
// mock claims from fixtures; Approve/Reject mutate local state only. No DB, no
// API — see CLAIM_FLOW_PLAN.md. The dev-only toolbar switches fixture sets so
// every visual state is smoke-testable in one sitting.

const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  pending: "Pending review",
  verified: "Verified owner",
  rejected: "Rejected",
};

const FIXTURE_SET_LABEL: Record<ClaimFixtureSet, string> = {
  mixed: "Mixed",
  allPending: "All pending",
  empty: "Empty",
};

const FIXTURE_SET_KEYS = Object.keys(CLAIM_FIXTURE_SETS) as ClaimFixtureSet[];

export default function AdminClaims() {
  const [fixtureSet, setFixtureSet] = useState<ClaimFixtureSet>("mixed");
  const [rows, setRows] = useState<ClaimRequest[]>(CLAIM_FIXTURE_SETS.mixed);

  // Reset the working rows whenever the mock set changes so approve/reject
  // decisions don't leak between fixture sets.
  useEffect(() => {
    setRows(CLAIM_FIXTURE_SETS[fixtureSet]);
  }, [fixtureSet]);

  return (
    <div className={tableStyles.tableWrapper}>
      <div className={styles.mockToolbar}>
        <span className={styles.mockLabel}>Mock data</span>
        {FIXTURE_SET_KEYS.map(key => (
          <button
            key={key}
            type="button"
            className={`${styles.mockButton} ${
              fixtureSet === key ? styles.mockButtonActive : ""
            }`}
            onClick={() => setFixtureSet(key)}
          >
            {FIXTURE_SET_LABEL[key]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className={tableStyles.emptyCell}>No claim requests yet.</div>
      ) : (
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.nameCell}>Requested</th>
              <th>User</th>
              <th>Listing</th>
              <th>Claimed handle</th>
              <th>Evidence</th>
              <th>Status</th>
              <th
                className={tableStyles.actionHeader}
                aria-label="Actions"
              ></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className={tableStyles.nameCell}>
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td>{row.userEmail}</td>
                <td>
                  {row.listingName}
                  <span className={styles.entityTag}>{row.entityType}</span>
                </td>
                <td>
                  <a
                    href={`https://instagram.com/${row.claimedHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={tableStyles.link}
                  >
                    @{row.claimedHandle}
                  </a>
                </td>
                <td>
                  <span className={styles.evidence}>
                    <code className={styles.code}>{row.code}</code>
                    <span
                      className={row.dmReceived ? styles.dmYes : styles.dmNo}
                    >
                      {row.dmReceived ? "\u2713 DM received" : "Awaiting DM"}
                    </span>
                  </span>
                </td>
                <td>
                  <span
                    className={`${tableStyles.statusBadge} ${styles[row.status]}`}
                  >
                    {CLAIM_STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className={tableStyles.actionCell}>
                  {row.status === "pending" && (
                    <div className={tableStyles.submissionActions}>
                      <button
                        type="button"
                        className={tableStyles.addedSubmissionButton}
                        title="Approve claim — user becomes verified owner"
                        onClick={() =>
                          setRows(prev =>
                            prev.map(r =>
                              r.id === row.id ? { ...r, status: "verified" } : r
                            )
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={tableStyles.deleteSubmissionButton}
                        title="Reject claim"
                        onClick={() =>
                          setRows(prev =>
                            prev.map(r =>
                              r.id === row.id ? { ...r, status: "rejected" } : r
                            )
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
