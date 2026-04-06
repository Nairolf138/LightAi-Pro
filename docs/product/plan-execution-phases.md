# Plan d’exécution — Stabilisation technique vers pilote terrain

## Statut du document
- **Version** : 1.0
- **Date** : 6 avril 2026
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

## 2) Phase 1 (4–6 semaines) — Refacto architecture + moteur + simulateur

## Objectif
Rendre la base technique robuste, testable et prédictible avant connexion à du matériel réel.

## Lots de travail
1. **Refactor architecture runtime**
   - Isolation claire `UI` / `Application Services` / `Engine Runtime` / `IO Adapters`.
   - Contrats d’interface stables entre couches.
2. **Stabilisation moteur**
   - Horloge interne unifiée.
   - Pipeline d’exécution deterministic (tick, scheduling cues, priorité blackout).
3. **Simulateur**
   - Simulateur fixtures exploitant la même API que les sorties réelles.
   - Scénarios de charge reproductibles pour tests de non-régression.

## Critères de sortie mesurables (DoD Phase 1)
| ID critère | Critère mesurable | Seuil de réussite | Preuve attendue | Tickets liés (minimum) |
|---|---|---|---|---|
| P1-C01 | Couverture des tests unitaires du moteur | ≥ 80% sur modules moteur critiques | Rapport de couverture CI | `ENG-101`, `ENG-102` |
| P1-C02 | Jitter boucle moteur en simulateur | p95 ≤ 5 ms sur run 30 min | Export métriques runtime | `ENG-111`, `SIM-121` |
| P1-C03 | Stabilité simulateur en charge | 0 crash non géré sur campagne 2h | Rapport d’exécution + logs | `SIM-122`, `QA-131` |
| P1-C04 | Dette architecture bloquante | 100% des ADR P1 validées | Dossier ADR signé TL | `ARCH-141`, `ARCH-142` |
| P1-C05 | Temps de blackout (simulateur) | ≤ 100 ms (p95) | Test automatisé dédié | `ENG-151`, `QA-132` |

## Gate de sortie
- **Go Phase 2** si **100%** des critères P1-C01 à P1-C05 sont atteints.
- Exception possible uniquement via dérogation écrite Product + Tech Lead (durée max 5 jours ouvrés).

---

## 3) Phase 2 (4–8 semaines) — Protocoles réels + patch fixtures + cue engine

## Objectif
Passer d’un runtime validé en simulation à un runtime opérationnel sur matériel/protocoles réels.

## Lots de travail
1. **Protocoles réels**
   - Implémentation et validation Art-Net (P0), DMX USB (P1), OSC (P2).
   - Gestion reconnexion, timeout, erreurs réseau/USB.
2. **Patch fixtures**
   - CRUD patch complet, validation adresses/conflits.
   - Persistance versionnée show patch.
3. **Cue engine**
   - Transitions (fade in/out), délais, enchaînement fiable.
   - Priorité hard du blackout.

## Critères de sortie mesurables (DoD Phase 2)
| ID critère | Critère mesurable | Seuil de réussite | Preuve attendue | Tickets liés (minimum) |
|---|---|---|---|---|
| P2-C01 | Latence commande → émission réelle | ≤ 40 ms (p95) sur setup de référence | Bench hardware reproductible | `PROTO-201`, `QA-231` |
| P2-C02 | Fiabilité émission protocolaire | ≥ 99.5% trames envoyées sans erreur fatale sur 1h | Logs protocole + dashboard erreurs | `PROTO-202`, `PROTO-203` |
| P2-C03 | Intégrité patch fixtures | 0 conflit adresse non détecté en tests fonctionnels | Suite tests patch verte | `PATCH-211`, `QA-232` |
| P2-C04 | Exécution cue list | 100% des scénarios critiques passants (play/stop/next/prev/blackout) | Rapport QA scénarios | `CUE-221`, `QA-233` |
| P2-C05 | Résilience perte connexion | Reconnexion ou fallback < 3 s sur 95% des cas injectés | Campagne chaos/protocole | `PROTO-204`, `ENG-234` |

## Gate de sortie
- **Go Phase 3** si P2-C01..P2-C05 validés + aucun bug Sev1 ouvert sur protocoles/cue engine.

---

## 4) Phase 3 (4–6 semaines) — Packaging desktop + QA lourde + pilote terrain

## Objectif
Industrialiser la livraison, prouver la stabilité en environnement proche production, puis en pilote.

## Lots de travail
1. **Packaging desktop**
   - Builds signés Windows/macOS.
   - Politique de mise à jour et rollback.
2. **QA lourde**
   - Campagnes endurance, montée en charge, non-régression multi-OS.
   - Matrice de compatibilité interfaces USB-DMX validées MVP.
3. **Pilote terrain**
   - Déploiement restreint (sites pilotes).
   - Collecte incidents + boucle de correction rapide.

## Critères de sortie mesurables (DoD Phase 3)
| ID critère | Critère mesurable | Seuil de réussite | Preuve attendue | Tickets liés (minimum) |
|---|---|---|---|---|
| P3-C01 | Succès packaging desktop | 100% builds installables/signés sur OS cibles | Artifacts CI + checksum | `PKG-301`, `PKG-302` |
| P3-C02 | Endurance runtime | 8h sans crash ni fuite mémoire critique | Rapport soak test | `QA-311`, `ENG-312` |
| P3-C03 | Taux de régression | 0 régression Sev1/Sev2 sur suite release | Rapport QA final | `QA-313`, `QA-314` |
| P3-C04 | Qualité pilote terrain | ≤ 3 incidents Sev2 max / semaine / site et 0 Sev1 | Journal incidents pilote | `FIELD-321`, `FIELD-322` |
| P3-C05 | Prêt pour déploiement élargi | 100% actions post-pilote closes | Check-list release signée | `PKG-303`, `FIELD-323` |

## Gate de sortie
- **Go Release élargie** si P3-C01..P3-C05 validés et comité release approuve.

---

## 5) Matrice de traçabilité (critères ⇄ tickets)

| Phase | Critère | Tickets techniques requis | Statut (à maintenir) |
|---|---|---|---|
| Phase 1 | P1-C01 | `ENG-101`, `ENG-102` | TODO |
| Phase 1 | P1-C02 | `ENG-111`, `SIM-121` | TODO |
| Phase 1 | P1-C03 | `SIM-122`, `QA-131` | TODO |
| Phase 1 | P1-C04 | `ARCH-141`, `ARCH-142` | TODO |
| Phase 1 | P1-C05 | `ENG-151`, `QA-132` | TODO |
| Phase 2 | P2-C01 | `PROTO-201`, `QA-231` | TODO |
| Phase 2 | P2-C02 | `PROTO-202`, `PROTO-203` | TODO |
| Phase 2 | P2-C03 | `PATCH-211`, `QA-232` | TODO |
| Phase 2 | P2-C04 | `CUE-221`, `QA-233` | TODO |
| Phase 2 | P2-C05 | `PROTO-204`, `ENG-234` | TODO |
| Phase 3 | P3-C01 | `PKG-301`, `PKG-302` | TODO |
| Phase 3 | P3-C02 | `QA-311`, `ENG-312` | TODO |
| Phase 3 | P3-C03 | `QA-313`, `QA-314` | TODO |
| Phase 3 | P3-C04 | `FIELD-321`, `FIELD-322` | TODO |
| Phase 3 | P3-C05 | `PKG-303`, `FIELD-323` | TODO |

> Recommandation opérationnelle : convertir ce tableau en “Epic + child tickets” dans l’outil de suivi (Jira/Linear/GitHub Projects), avec lien direct vers les preuves (rapport CI, logs, dashboards, procès-verbal go/no-go).

---

## 6) Risques principaux et contre-mesures

- **Risque R1 — Variabilité matériel USB-DMX**
  - Contre-mesure : shortlist matérielle figée en début de phase 2 + banc de test dédié.
- **Risque R2 — Dérive performance sous charge réelle**
  - Contre-mesure : observabilité runtime obligatoire (latence, jitter, pertes trames) dès phase 1.
- **Risque R3 — Scope creep produit en pleine exécution**
  - Contre-mesure : process de change request formel avec impact délai/coût/risque.
- **Risque R4 — Qualité insuffisante avant pilote**
  - Contre-mesure : seuils QA bloquants en phase 3, non contournables sans dérogation formelle.

---

## 7) Décision de lancement

- Sponsor produit : ☐
- Tech Lead : ☐
- QA Lead : ☐
- Date de validation : ☐
- Décision : ☐ Go / ☐ No-Go
