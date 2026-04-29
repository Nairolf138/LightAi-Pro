# Statut hebdomadaire — Exécution phases produit

- **Semaine** : `YYYY-Www`
- **Date de publication** : `YYYY-MM-DD`
- **Owner** : Product + Tech Lead + QA
- **Phase en cours** : `P1 | P2 | P3`
- **Décision de phase (hebdo)** : `GO | NO-GO | GO conditionnel`

## 1) Critères validés cette semaine

| Critère | Statut | Preuves (CI/logs/bench/QA) | Décision datée | Commentaire |
|---|---|---|---|---|
| P1-C01 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C02 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C03 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C04 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P1-C05 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C01 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C02 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C03 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C04 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
| P2-C05 | TODO | `lien` | `YYYY-MM-DD • Go/No-Go` | - |
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

- **Date** : `YYYY-MM-DD`
- **Décision** : `GO | NO-GO | GO conditionnel`
- **Portée** : `Passage phase suivante / maintien phase actuelle`
- **Conditions éventuelles** :
  - `Condition 1`
  - `Condition 2`
- **Décideurs** : Product / Tech Lead / QA Lead

## 5) Journal des décisions (historique)

| Date | Objet | Décision | Références preuves | Signataires |
|---|---|---|---|---|
| YYYY-MM-DD | Gate P1 | GO/NO-GO | `liens` | Product, Tech Lead, QA |
