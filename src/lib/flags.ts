// Central feature-flag registry.
//
// Flags are BUILD-TIME, resolved from Vite env vars (`VITE_FEATURE_*`). Vite
// dead-code-eliminates a `false` branch, so a disabled feature's code never
// ships in the bundle — keep in-progress work out of production by leaving its
// var unset in the prod environment.
//
// Wiring: set `VITE_FEATURE_<NAME>=true` in local `.env` and on Vercel
// *preview* deployments; leave it unset in *production* until launch.
//
// This is intentionally not a runtime flag service — no per-user targeting, no
// flip-without-redeploy. Reach for Vercel Edge Config / a flag provider only if
// gradual rollout is ever actually needed.

export const flags = {
  /**
   * Accounts + save-favorites + claim-your-listing. In active development;
   * see CLAIM_FLOW_PLAN.md. Off in production until the experience is locked
   * and wired.
   */
  accounts: import.meta.env.VITE_FEATURE_ACCOUNTS === "true",
} as const;

export type FeatureFlag = keyof typeof flags;
