# Legacy migrations (pre-CLI) — do not run

These hand-written `.sql` files predate the Supabase CLI workflow and were
applied manually via the dashboard. They are kept for history only.

The live schema source of truth is now `supabase/migrations/` (managed by the
Supabase CLI); the current prod schema is captured in the CLI baseline
migration. Do not run anything in this folder against prod.
