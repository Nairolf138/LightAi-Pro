# Statut hebdomadaire — Exécution phases produit

- **Semaine** : `2026-W18`
- **Date de publication** : `2026-04-30`
- **Owner** : Product + Tech Lead + QA
- **Phase en cours** : `P2`
- **Décision de phase (hebdo)** : `GO conditionnel`

## 0) Table de synthèse — Critère → preuve → ticket(s) → verdict

| Critère | Preuve principale | Ticket(s) | Verdict |
|---|---|---|---|
| P2-C01 | `artifacts/phase2-exit/phase2-metrics.json` (`p2c01.latencyMs.p95=0.100379...`) | `PROTO-201`, `QA-231` | ✅ Conforme |
| P2-C02 | `artifacts/phase2-exit/phase2-bench.log` (`Reliability=100.0000%`) | `PROTO-202`, `PROTO-203` | ✅ Conforme |
| P2-C03 | Preuve incomplète (absence de section explicite dans `phase2-report.md` + absence clé `p2c03` dans `phase2-metrics.json`) | `PATCH-211`, `QA-232`, **`PATCH-212` (remédiation, échéance 2026-05-07)** | ⚠️ Conditionnel |
| P2-C04 | `artifacts/phase2-exit/phase2-metrics.json` (`play/stop/next/prev/blackout=true`) | `CUE-221`, `QA-233` | ✅ Conforme |
| P2-C05 | `artifacts/phase2-exit/phase2-metrics.json` (`p2c05.reconnectMs.p95=0.008064...`) | `PROTO-204`, `QA-234` | ✅ Conforme |

## 1) Critères validés cette semaine

| Critère | Statut | Preuves (CI/logs/bench/QA) | Décision datée | Commentaire |
|---|---|---|---|---|
| P1-C01 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C02 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C03 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C04 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C05 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C01 | DONE | `artifacts/phase2-exit/phase2-report.md`, `artifacts/phase2-exit/phase2-bench.log`, `artifacts/phase2-exit/phase2-metrics.json` | `2026-04-30 • Go` | p95 0.100 ms ≤ 40 ms |
| P2-C02 | DONE | `artifacts/phase2-exit/phase2-report.md`, `artifacts/phase2-exit/phase2-bench.log`, `artifacts/phase2-exit/phase2-metrics.json` | `2026-04-30 • Go` | Fiabilité 100% ≥ 99.5% |
| P2-C03 | AT_RISK | `artifacts/phase2-exit/phase2-report.md` (partiel), `artifacts/phase2-exit/phase2-bench.log` (absence entrée dédiée), `artifacts/phase2-exit/phase2-metrics.json` (absence `p2c03`) | `2026-04-30 • Go conditionnel` | Remédiation `PATCH-212` due 2026-05-07 |
| P2-C04 | DONE | `artifacts/phase2-exit/phase2-report.md`, `artifacts/phase2-exit/phase2-bench.log`, `artifacts/phase2-exit/phase2-metrics.json` | `2026-04-30 • Go` | 100% scénarios critiques PASS |
| P2-C05 | DONE | `artifacts/phase2-exit/phase2-report.md`, `artifacts/phase2-exit/phase2-bench.log`, `artifacts/phase2-exit/phase2-metrics.json` | `2026-04-30 • Go` | p95 reconnexion 0.008 ms < 3 s |
| P3-C01 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P3-C02 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P3-C03 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P3-C04 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P3-C05 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |

> Statuts autorisés : `TODO`, `IN_PROGRESS`, `AT_RISK`, `BLOCKED`, `DONE`.

### Règles de preuve renforcées (alignement P3-C01 / P3-C05)
- **P3-C01**: la colonne Preuves doit inclure **artifacts signés + checksums + changelog/release notes publiés**.
- **P3-C05**: la colonne Preuves doit référencer la **checklist RC signée** et la **preuve de rollback testé**.
- Référence checklist: `docs/admin/deployment.md` (section *Checklist release candidate*).

## 2) Risques ouverts

| ID risque | Description | Impact | Mitigation | Owner | Statut |
|---|---|---|---|---|---|
| R1 | Variabilité matériel USB-DMX | Élevé | Shortlist matérielle + banc dédié | Tech Lead | OPEN |
| R2 | Dérive perf charge réelle | Élevé | Observabilité latence/jitter | Eng Lead | OPEN |
| R3 | Scope creep en exécution | Moyen | Change request formel | Product | OPEN |
| R4 | Qualité insuffisante pré-pilote | Élevé | Seuils QA bloquants | QA Lead | OPEN |

## 3) Blocages matériels / environnement

| ID blocage | Système impacté | Description | Date ouverture | ETA résolution | Contournement |
|---|---|---|---|---|---|
| HW-001 | USB-DMX | `à renseigner` | `YYYY-MM-DD` | `YYYY-MM-DD` | `à renseigner` |

## 4) Décision de phase (go/no-go)

- **Date** : `2026-04-30`
- **Décision** : `GO conditionnel`
- **Portée** : `Passage vers préparation P3 avec maintien du gate P2-C03 ouvert jusqu'à remédiation`
- **Conditions éventuelles** :
  - Clôturer `PATCH-212` au plus tard le **2026-05-07** avec preuves instrumentées P2-C03 (bench + metrics + report).
  - Revue de validation QA post-remédiation et mise à jour du verdict en `DONE` pour P2-C03.
- **Décideurs** :
  - `Product Lead` — **Signé le 2026-04-30**
  - `Tech Lead` — **Signé le 2026-04-30**
  - `QA Lead` — **Signé le 2026-04-30**

## 5) Journal des décisions (historique)

| Date | Objet | Décision | Références preuves | Signataires |
|---|---|---|---|---|
| 2026-04-30 | Gate P2 | GO conditionnel | `artifacts/phase2-exit/phase2-report.md`, `artifacts/phase2-exit/phase2-bench.log`, `artifacts/phase2-exit/phase2-metrics.json`, `PATCH-212` | Product Lead, Tech Lead, QA Lead |


## 6) Limitations levées ce mois-ci

| Mois | Limitation ID | Limitation levée | Ticket(s) clôturé(s) | Impact utilisateur observé | Validation (preuve mesurable) |
|---|---|---|---|---|---|
| 2026-04 | `à renseigner` | `à renseigner` | `PROTO-* / ENG-* / PKG-* / QA-* / FIELD-*` | `à renseigner` | `bench, QA report, ticket de clôture` |
