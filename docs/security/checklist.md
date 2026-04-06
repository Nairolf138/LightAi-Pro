# Security hardening checklist

## Authentication & identity
- [x] Enforce a strong password policy in `AuthModal` (length, complexity, email-reuse prevention).
- [x] Provide explicit user-facing authentication error messages for common failure classes.
- [x] Add a local anti-bruteforce UX lock after repeated failed attempts.

## Secrets & credential storage
- [x] Implement a desktop secure vault using Electron `safeStorage` + OS keychain.
- [x] Route vault access through typed IPC contracts only (no direct Node access in renderer).
- [x] Store remembered credentials only when user opt-in is enabled.
- [x] Ensure vault payload is encrypted at rest (`vault.enc.json` stores ciphertext only).

## Desktop integrity & release security
- [x] Add a build-signing script to generate SHA-256 digest + signature metadata.
- [x] Verify signed integrity metadata at desktop startup before opening UI.
- [x] Block startup and display a security error if integrity verification fails.
- [ ] Wire platform-native code signing in CI/release pipeline (macOS notarization, Windows Authenticode).

## UI / web hardening
- [x] Add strict CSP on the UI entry document (`index.html`).
- [x] Add matching security headers in Vite dev/preview server configuration.
- [x] Add desktop response-header CSP + anti-clickjacking headers.
- [x] Disable renderer popups and arbitrary navigations from desktop shell.

## Operational follow-ups
- [ ] Rotate signing keys and document revocation process.
- [ ] Add automated security regression tests (auth error mapping, vault IPC validation, integrity checks).
- [ ] Add SAST/dependency scanning in CI and periodic dependency update policy.
