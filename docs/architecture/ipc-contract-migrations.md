# IPC Contract Migrations

## 1.2.0 — 2026-05-18
- Added runtime status validation for nullable `deviceStatus` payloads so handshake responses reject malformed device status objects.
- Preserved the existing `RuntimeStatus` payload shape, keeping the change backward-compatible for valid renderer and desktop shell clients.

## 1.1.0 — 2026-04-30
- Added `contractVersion` to `RuntimeStatus` payload.
- Added startup handshake check on `runtime:status` in renderer runtime client.
- Operators must redeploy desktop shell and renderer together when versions mismatch.
