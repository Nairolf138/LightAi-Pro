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

## 2) Mise à jour

## Stratégie
- Maintenir deux canaux: `stable` et `beta`.
- Valider compatibilité de projet avant promotion.
- Publier notes de version systématiques.

## Scripts utiles
```bash
node scripts/release/verify-project-compat.mjs
node scripts/release/generate-release-notes.mjs
```

En cas d'incident de release:
```bash
node scripts/release/rollback-release.mjs
```

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
