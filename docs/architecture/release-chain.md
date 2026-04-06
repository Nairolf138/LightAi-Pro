# Chaîne de release desktop (Windows / macOS)

Ce document décrit la chaîne de release mise en place pour LightAI Pro.

## 1) Build reproductible Windows/macOS

- Workflow GitHub Actions: `.github/workflows/release-desktop.yml`.
- Build matrix sur `macos-latest` et `windows-latest`.
- Pré-build identique sur chaque OS:
  - `npm ci`
  - `npm ci --prefix desktop`
  - `npm run build`
- Packaging via `electron-builder` avec une configuration unique (`desktop/electron-builder.yml`) pour minimiser les divergences entre plateformes.

## 2) Signature code + notarization macOS + installateurs propres

- Signature de build via script `desktop/scripts/sign-build.mjs` pour générer `desktop/signature/build-integrity.json`.
- Installateur Windows NSIS et macOS DMG/ZIP configurés dans `desktop/electron-builder.yml`.
- macOS:
  - `hardenedRuntime: true`
  - entitlements dédiés (`desktop/security/entitlements.mac.plist`)
  - variables secrètes Apple pour notarization (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`).

## 3) Auto-update sécurisé (stable/beta)

- Policy de canal dans `desktop/release/updatePolicy.ts`:
  - variable `LIGHTAI_RELEASE_CHANNEL` (`stable` par défaut, `beta` autorisé)
  - `autoUpdater.allowPrerelease` activé uniquement pour beta
  - téléchargement automatique seulement après détection d’une update valide.
- Configuration Electron Builder:
  - `detectUpdateChannel: true`
  - `generateUpdatesFilesForAllChannels: true`

## 4) Gestion de compatibilité de versions projet

- Matrice de compatibilité version app <-> format projet: `desktop/release/project-compatibility.json`.
- Validation automatisée: `scripts/release/verify-project-compat.mjs`.
- Vérification au runtime desktop via `checkProjectCompatibility(...)` avant ouverture complète de l’application.

## 5) Notes de version + rollback release

- Notes de release générées automatiquement par `scripts/release/generate-release-notes.mjs`.
- Plan de rollback générable via `scripts/release/rollback-release.mjs` (workflow dispatch).
- Publication consolidée dans la job `publish` (GitHub Release + artefacts Windows/macOS).

## Secrets CI/CD requis

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

## Commandes locales utiles

```bash
npm run build
npm run build:mac --prefix desktop
npm run build:win --prefix desktop
npm run sign:build --prefix desktop
LIGHTAI_APP_VERSION=1.4.0 LIGHTAI_PROJECT_FORMAT_VERSION=2 node scripts/release/verify-project-compat.mjs
```
