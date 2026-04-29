# Checklist Phase 2 Exit (P2-C01 → P2-C05)

Référence: `docs/product/plan-execution-phases.md`.

## Décision go/no-go
- [ ] Tous les critères P2-C01 à P2-C05 sont validés.
- [ ] Aucun bug Sev1 ouvert sur protocoles/cue engine.
- [ ] Rapport de décision signé (Product + Tech Lead + QA Lead).

## P2-C01 — Latence commande → émission réelle (≤ 40 ms p95)
- [ ] Campagne bench exécutée sur setup de référence.
- [ ] Export métriques versionné (`phase2-metrics.json`).
- [ ] p95 observé ≤ 40 ms.
- Tickets/preuves:
  - [ ] `PROTO-201` (implémentation mesure latence)
  - [ ] `QA-231` (qualification et validation seuil)

## P2-C02 — Fiabilité émission protocolaire (≥ 99.5% / 1h)
- [ ] Campagne fiabilité protocoles exécutée.
- [ ] Logs protocoles versionnés (`phase2-bench.log`).
- [ ] Taux de succès trames ≥ 99.5%.
- Tickets/preuves:
  - [ ] `PROTO-202` (gestion erreurs émission)
  - [ ] `PROTO-203` (dashboard/exports erreurs)

## P2-C03 — Intégrité patch fixtures (0 conflit non détecté)
- [ ] Suite fonctionnelle patch exécutée.
- [ ] Rapport vert archivé (`phase2-report.md`).
- [ ] 0 conflit d’adresse non détecté.
- Tickets/preuves:
  - [ ] `PATCH-211` (règles conflit patch)
  - [ ] `QA-232` (cas de tests patch)

## P2-C04 — Exécution cue list (play/stop/next/prev/blackout)
- [ ] Scénarios critiques exécutés et passants.
- [ ] Rapport scénarios versionné (`phase2-report.md`).
- [ ] 100% des scénarios critiques passants.
- Tickets/preuves:
  - [ ] `CUE-221` (robustesse exécution cues)
  - [ ] `QA-233` (tests scénarios critiques)

## P2-C05 — Résilience perte connexion (reconnexion/fallback < 3 s p95)
- [ ] Campagne chaos protocole exécutée.
- [ ] Export reconnexion versionné (`phase2-metrics.json`).
- [ ] p95 reconnexion/fallback < 3 s.
- Tickets/preuves:
  - [ ] `PROTO-204` (stratégie reconnexion/fallback)
  - [ ] `QA-234` (injection de panne + validation)

## Convention de traçabilité des preuves
Chaque preuve doit référencer au moins un ticket de type:
- `PROTO-*`: latence, trames, reconnexion protocoles.
- `PATCH-*`: intégrité patch fixtures.
- `CUE-*`: commandes show et transitions critiques.
- `QA-*`: qualification, scénarios, verdict go/no-go.
