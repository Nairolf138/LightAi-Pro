# IPC Contract Migrations

## 1.1.0 — 2026-04-30
- Added `contractVersion` to `RuntimeStatus` payload.
- Added startup handshake check on `runtime:status` in renderer runtime client.
- Operators must redeploy desktop shell and renderer together when versions mismatch.
