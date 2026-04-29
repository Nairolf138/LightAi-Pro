# Plan d’exécution — Stabilisation technique vers pilote terrain

## Statut du document
- **Version** : 1.1
- **Date** : 29 avril 2026
- **Portée** : formalisation exécutable en 3 phases, avec critères de sortie mesurables et traçabilité tickets.
- **Principe** : **aucune phase ne démarre sans validation explicite de la phase précédente** (go/no-go).

---

## 1) Cadre global d’exécution

## Hypothèses de planning
- **Phase 1** : 4 à 6 semaines.
- **Phase 2** : 4 à 8 semaines.
- **Phase 3** : 4 à 6 semaines.
- Durée totale cible : **12 à 20 semaines** selon aléas matériel/protocoles.

## Gouvernance
- Rituels minimum :
  - Point d’avancement hebdomadaire (Product + Tech Lead + QA).
  - Revue risques 2 fois/semaine en phase 2 et phase 3.
  - Revue go/no-go formelle en fin de phase.
- Pilotage par **indicateurs quantifiés** uniquement (pas de sortie “au ressenti”).

## Convention de tickets (traçabilité)
- Préfixes recommandés :
  - `ARCH-*` (architecture)
  - `ENG-*` (moteur / runtime)
  - `SIM-*` (simulateur)
  - `PROTO-*` (protocoles réels)
  - `PATCH-*` (patch fixtures)
  - `CUE-*` (cue engine)
  - `PKG-*` (packaging desktop)
  - `QA-*` (qualification)
  - `FIELD-*` (pilote terrain)
- Chaque critère de sortie ci-dessous inclut des tickets “minimum” à clôturer.

---

## 2) Backlog opérationnel (Epics + sous-tickets) et statut vivant

> Utilisation recommandée : **1 Epic par critère** + **sous-tickets techniques/QA/preuves**. Le statut se met à jour en continu dans `docs/product/status.md`.

| Critère | Epic recommandé | Sous-tickets minimum | Type de preuve obligatoire | Lien preuve (à renseigner) | Décision go/no-go datée (à renseigner) | Statut vivant |
|---|---|---|---|---|---|---|
| **P1-C01** Couverture tests moteur | `EPIC-P1-C01` | `ENG-101`, `ENG-102`, `QA-131` | Rapport de couverture CI | `CI-COV-P1-C01` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P1-C02** Jitter boucle moteur | `EPIC-P1-C02` | `ENG-111`, `SIM-121`, `QA-132` | Bench/runtime metrics export | `BENCH-P1-C02` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P1-C03** Stabilité simulateur | `EPIC-P1-C03` | `SIM-122`, `QA-131` | Logs de campagne + rapport exécution | `LOG-P1-C03` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P1-C04** ADR architecture | `EPIC-P1-C04` | `ARCH-141`, `ARCH-142` | QA report architecture + ADR signées | `ADR-P1-C04` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P1-C05** Temps blackout simulateur | `EPIC-P1-C05` | `ENG-151`, `QA-132` | Résultat test automatisé + logs | `TEST-P1-C05` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P2-C01** Latence commande→émission | `EPIC-P2-C01` | `PROTO-201`, `QA-231` | Bench hardware reproductible | `BENCH-P2-C01` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P2-C02** Fiabilité protocolaire | `EPIC-P2-C02` | `PROTO-202`, `PROTO-203`, `QA-231` | Logs protocole + dashboard erreurs | `LOG-P2-C02` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P2-C03** Intégrité patch fixtures | `EPIC-P2-C03` | `PATCH-211`, `QA-232` | Rapport suite tests patch | `QA-P2-C03` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P2-C04** Exécution cue list | `EPIC-P2-C04` | `CUE-221`, `QA-233` | QA report scénarios critiques | `QA-P2-C04` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P2-C05** Résilience déconnexion | `EPIC-P2-C05` | `PROTO-204`, `ENG-234`, `QA-233` | Campagne chaos + logs temps de reprise | `CHAOS-P2-C05` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P3-C01** Packaging desktop signé | `EPIC-P3-C01` | `PKG-301`, `PKG-302` | Artifacts CI + checksums | `CI-P3-C01` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P3-C02** Endurance runtime | `EPIC-P3-C02` | `QA-311`, `ENG-312` | Rapport soak test + logs mémoire | `SOAK-P3-C02` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P3-C03** Taux de régression | `EPIC-P3-C03` | `QA-313`, `QA-314` | Rapport QA final release | `QA-P3-C03` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P3-C04** Qualité pilote terrain | `EPIC-P3-C04` | `FIELD-321`, `FIELD-322` | Journal incidents hebdo | `FIELD-P3-C04` | `YYYY-MM-DD • Go/No-Go` | TODO |
| **P3-C05** Prêt déploiement élargi | `EPIC-P3-C05` | `PKG-303`, `FIELD-323`, `QA-314` | Checklist release signée | `REL-P3-C05` | `YYYY-MM-DD • Go/No-Go` | TODO |

### Statut vivant par critère
- Valeurs recommandées : `TODO`, `IN_PROGRESS`, `AT_RISK`, `BLOCKED`, `DONE`.
- Un critère **DONE** doit avoir :
  1) toutes les preuves liées,
  2) date de décision,
  3) décision explicite `Go`.
- Un critère **No-Go** reste `BLOCKED` jusqu’à plan de remédiation approuvé.

---

## 3) Gates de phase (rappel)
- **Go Phase 2** si **100%** des critères P1-C01 à P1-C05 sont validés.
- **Go Phase 3** si P2-C01..P2-C05 validés + aucun bug Sev1 ouvert sur protocoles/cue engine.
- **Go Release élargie** si P3-C01..P3-C05 validés et comité release approuve.

---

## 4) Process de preuve et décision

Pour **chaque critère** P1/P2/P3 :
1. Lier au moins une preuve exploitable : rapport CI, logs, bench, QA report.
2. Ajouter un résumé en 3 lignes max dans `docs/product/status.md`.
3. Capturer la décision go/no-go avec **date ISO** (`YYYY-MM-DD`) + décideurs.
4. Conserver l’historique (ne pas écraser les décisions précédentes).

---

## 5) Risques principaux et contre-mesures

- **Risque R1 — Variabilité matériel USB-DMX**
  - Contre-mesure : shortlist matérielle figée en début de phase 2 + banc de test dédié.
- **Risque R2 — Dérive performance sous charge réelle**
  - Contre-mesure : observabilité runtime obligatoire (latence, jitter, pertes trames) dès phase 1.
- **Risque R3 — Scope creep produit en pleine exécution**
  - Contre-mesure : process de change request formel avec impact délai/coût/risque.
- **Risque R4 — Qualité insuffisante avant pilote**
  - Contre-mesure : seuils QA bloquants en phase 3, non contournables sans dérogation formelle.

---

## 6) Décision de lancement

- Sponsor produit : ☐
- Tech Lead : ☐
- QA Lead : ☐
- Date de validation : ☐
- Décision : ☐ Go / ☐ No-Go
