---
name: api-sync
description: Cross-repo API-sync gate for trad-directory <-> td-chrome-ext; run before done.
alwaysApply: true
---
# API sync is a cross-repo change

Editing `trad-directory/api/*.ts` or `td-chrome-ext/lib/directory.js` — or
any request/response shape one side depends on — is a single change that
spans both repos. Update the API handler and the client caller together in
the same change; never ship one side alone.

The sync check lives in the client repo
(`td-chrome-ext/scripts/check-api-sync.js`) and runs automatically on
`git push` in BOTH repos via `.githooks/pre-push` (enable once per clone:
`git config core.hooksPath .githooks`). To run it by hand from the
`td-chrome-ext` repo root:

```
node scripts/check-api-sync.js
```

A non-zero exit blocks the push: the client calls an `/api/<x>` endpoint whose
`<x>.ts` handler no longer exists, or calls it with an HTTP method the handler
rejects (405). Warnings (direct Supabase writes that bypass an existing write
endpoint) must be read and justified, not ignored.
