# Contributing développeur (v0.1)

> Version document: 0.1  
> Dernière mise à jour: 2026-04-06

Merci de contribuer à LightAI-Pro.

## 1) Architecture (vue rapide)

- `src/`: UI React + logique applicative côté renderer.
- `src/core/`: moteurs fonctionnels (fixtures, show timeline, audio, protocol selector).
- `desktop/`: runtime natif Electron (IPC + accès matériel/protocoles).
- `tests/`: unit, integration, e2e et non-régression performance.

Principe clé: la UI n'accède jamais directement au hardware. Toute opération device/protocole passe par l'IPC natif.

---

## 2) Conventions de code

- TypeScript strict et typage explicite des contrats.
- Modules courts, orientés domaine (`core/show`, `core/fixtures`, `core/protocols`).
- Pas de logique hardware dans `src/`.
- Logs structurés via les utilitaires d'observabilité.

## Branch/commit
- Branches: `feature/*`, `fix/*`, `chore/*`.
- Commits impératifs et précis (ex: `docs: add user and admin operational guides`).

---

## 3) Setup local

```bash
npm install
npm run dev
```

Tests:
```bash
npm test
```

Lint:
```bash
npm run lint
```

Desktop (dev):
```bash
npm run desktop:dev
```

---

## 4) Tests attendus avant PR

Minimum:
1. `npm run lint`
2. `npm test`

Selon le scope:
- Modifier `src/core/show/*` => vérifier les tests unitaires show/lighting.
- Modifier protocoles/runtime => ajouter/adapter tests d'intégration.
- Modifier perf critique => exécuter la non-régression performance.

---

## 5) Process PR

- Décrire clairement le contexte, la solution et les risques.
- Lister les commandes de test exécutées.
- Ajouter les changements de documentation lorsque le comportement utilisateur change.
