# Déploiement administrateur (v0.1)

> Version document: 0.1  
> Dernière mise à jour: 2026-04-06

## 1) Installation

## Prérequis hôte
- Windows 10/11 x64 ou macOS 13+.
- Node.js 20+ pour build local.
- Accès aux secrets de signature/notarization (si release).

## Installer les dépendances
```bash
npm install
npm install --prefix desktop
```

## Build web
```bash
npm run build
```

## Build desktop
```bash
npm run desktop:build
```

La chaîne de release détaillée (signature, auto-update, rollback) est documentée dans `docs/architecture/release-chain.md`.

---

## 2) Workflow release unique

## Stratégie
- Maintenir deux canaux: `stable` et `beta`.
- Exécuter un workflow **strict et unique**: `compatibilité projet → release notes → publication → rollback validé`.
- Bloquer toute publication si un jalon du workflow est incomplet.

## Procédure opérationnelle (obligatoire)
1. **Compatibilité projet (gate 1)**
   ```bash
   LIGHTAI_APP_VERSION=vX.Y.Z LIGHTAI_PROJECT_FORMAT_VERSION=N node scripts/release/verify-project-compat.mjs
   ```
2. **Release notes (gate 2)**
   ```bash
   LIGHTAI_RELEASE_TAG=vX.Y.Z node scripts/release/generate-release-notes.mjs > artifacts/release-notes-vX.Y.Z.md
   ```
3. **Publication (gate 3)**
   - Publier les artifacts signés sur le canal ciblé (`beta` puis `stable`).
   - Publier changelog/release notes avec checksums.
4. **Rollback validé (gate 4)**
   ```bash
   LIGHTAI_CURRENT_TAG=vX.Y.Z LIGHTAI_ROLLBACK_TAG=vA.B.C LIGHTAI_ROLLBACK_VALIDATE=true node scripts/release/rollback-release.mjs --format=json
   ```
   - Un rollback doit être testé et tracé avant clôture release candidate.

## Prérequis scripts release

### `scripts/release/verify-project-compat.mjs`
- Variables requises:
  - `LIGHTAI_APP_VERSION` (ex: `v1.4.0` ou `1.4.0`).
  - `LIGHTAI_PROJECT_FORMAT_VERSION` (nombre).
- Dépendances:
  - Fichier `desktop/release/project-compatibility.json` présent et valide.
- Sortie attendue:
  - Message `Compatibility OK...` sinon erreur bloquante.

### `scripts/release/generate-release-notes.mjs`
- Variables requises:
  - `LIGHTAI_RELEASE_TAG` (tag release).
- Dépendances:
  - Historique git local accessible (`git log`, `git describe`).
- Sortie attendue:
  - Markdown de release notes incluant highlights et section compatibility.

### `scripts/release/rollback-release.mjs`
- Variables requises:
  - `LIGHTAI_ROLLBACK_TAG` (ex: `v1.3.2`).
- Variables recommandées:
  - `LIGHTAI_CURRENT_TAG`, `LIGHTAI_ROLLBACK_FORMAT` (`json|markdown`), `LIGHTAI_ROLLBACK_VALIDATE=true`.
- Dépendances:
  - Tags git disponibles localement (`git tag --list`).
  - Le tag rollback doit exister (sauf `LIGHTAI_SKIP_TAG_CHECK=true`, interdit en release candidate).
- Sortie attendue:
  - Plan de rollback JSON/Markdown avec statut de validation.

## Checklist release candidate (RC)

> Clôture RC autorisée uniquement si **tous** les critères sont signés.

| Critère RC | Preuve minimale | Sign-off Product | Sign-off Tech Lead | Sign-off QA |
|---|---|---|---|---|
| Compatibilité projet validée | Log d'exécution `verify-project-compat` | ☐ | ☐ | ☐ |
| Release notes générées et publiées | Fichier changelog/release notes versionné | ☐ | ☐ | ☐ |
| Publication artifacts signés réalisée | Lien artifacts CI/CD + manifest | ☐ | ☐ | ☐ |
| Checksums publiés | Fichier `checksums.txt`/SHA256 publié | ☐ | ☐ | ☐ |
| Rollback testé | Preuve `LIGHTAI_ROLLBACK_VALIDATE=true` + log | ☐ | ☐ | ☐ |
| Preuve post-release archivée | Bundle: checksums + changelog + preuve rollback | ☐ | ☐ | ☐ |

### Artifacts minimaux obligatoires par release
- `checksums` (SHA256) des artifacts publiés.
- `changelog` / release notes de la version.
- `preuve de rollback testé` (log/script output avec `LIGHTAI_ROLLBACK_VALIDATE=true`).

---

## 3) Backup et restauration

## Données à sauvegarder
- Fichiers show (timeline + patch + output config).
- Configuration opérateur locale.
- Exports diagnostics critiques.

## Politique recommandée
- Backup avant chaque spectacle.
- Rétention minimale: 30 jours.
- Copie hors machine de régie (stockage externe/chiffré).

## Test de restauration
- Exécuter mensuellement un test complet de restauration sur machine de préproduction.
- Vérifier ouverture show + lecture cue list + blackout.

---

## 4) Compatibilité adaptateurs matériels

Le runtime natif prend en charge les adaptateurs `dmx`, `artnet` et `osc` via une interface commune et expose un mode `dry-run` (`LIGHTAI_HARDWARE_DRY_RUN=true`) pour rejouer les flux sans émission physique.

| Adaptateur | Windows 10/11 | macOS 13+ | Notes opérationnelles |
|---|---|---|---|
| DMX USB (`dmxUsbAdapter`) | ✅ Supporté | ⚠️ Pilotes selon chipset | Vérifier driver USB/FTDI avant show, latence typique 2-10ms. |
| Art-Net (`artnetAdapter`) | ✅ Supporté | ✅ Supporté | Dépend du réseau local (broadcast/unicast), surveiller univers et collisions IP. |
| OSC (`oscAdapter`) | ✅ Supporté | ✅ Supporté | Support UDP standard; valider mapping d'adresses OSC côté console/récepteur. |
| Dry-run matériel (`dryRunAdapter`) | ✅ Supporté | ✅ Supporté | Aucun transport physique; utile pour tests de charge et diagnostics. |

### Résilience live
- Reconnexion automatique par device avec backoff exponentiel borné (500ms → 10s).
- Circuit breaker par device: ouverture temporaire après erreurs de transport répétées.
- État détaillé disponible via `runtime:status` (latence, erreurs récentes, reconnexion, circuit breaker).
