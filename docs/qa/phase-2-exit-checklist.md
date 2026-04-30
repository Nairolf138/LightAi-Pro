# Checklist Phase 2 Exit (P2-C01 → P2-C05)

Référence: `docs/product/plan-execution-phases.md`.

## Protocole de campagne reproductible
1. Exécuter le scénario de bench unifié: `node scripts/run-phase2-exit-bench.mjs`.
2. Vérifier que les artefacts suivants sont générés:
   - `artifacts/phase2-exit/phase2-metrics.json`
   - `artifacts/phase2-exit/phase2-bench.log`
   - `artifacts/phase2-exit/phase2-report.md`
3. Contrôler le schéma de métriques JSON versionné (`schemaVersion: "2.0.0"`) pour l’automatisation P2-C01/P2-C02/P2-C05.
4. Valider les seuils bloquants (go/no-go):
   - p95 latence (P2-C01) <= 40 ms
   - taux succès trames (P2-C02) >= 99.50%
   - p95 reconnexion/fallback (P2-C05) <= 3000 ms
5. Publier le résumé QA lisible depuis `phase2-report.md` avec verdict explicite PASS/FAIL par critère.

## Décision go/no-go
- [x] Tous les critères P2-C01 à P2-C05 sont validés ou couverts par condition formelle (voir décision datée 2026-04-30).
- [x] Aucun bug Sev1 ouvert sur protocoles/cue engine (revue QA du 2026-04-30).
- [x] Rapport de décision signé (Product + Tech Lead + QA Lead).

## P2-C01 — Latence commande → émission réelle (≤ 40 ms p95)
- [x] Campagne bench exécutée sur setup de référence.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-bench.log` (`[PROTO-201] ... threshold<=40ms => PASS`).
- [x] Export métriques versionné (`phase2-metrics.json`).  
  **Preuve unique:** `artifacts/phase2-exit/phase2-metrics.json` (`schemaVersion=2.0.0`, `p2c01.latencyMs.p95`).
- [x] p95 observé ≤ 40 ms.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-report.md` (résultat P2-C01).

## P2-C02 — Fiabilité émission protocolaire (≥ 99.5% / 1h)
- [x] Campagne fiabilité protocoles exécutée.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-report.md` (résultat P2-C02: success rate).
- [x] Logs protocoles versionnés (`phase2-bench.log`).  
  **Preuve unique:** `artifacts/phase2-exit/phase2-bench.log` (`[PROTO-202] SuccessRate=... threshold>=99.50% => PASS`).
- [x] Taux de succès trames ≥ 99.5%.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-metrics.json` (`p2c02.frames.successRate`).

## P2-C04 — Exécution cue list (play/stop/next/prev/blackout)
- [x] Scénarios critiques exécutés et passants.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-bench.log` (`[CUE-221] ... => PASS`).
- [x] Rapport scénarios versionné (`phase2-report.md`).  
  **Preuve unique:** `artifacts/phase2-exit/phase2-report.md` (résultat P2-C04).
- [x] 100% des scénarios critiques passants.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-metrics.json` (`p2c04.pass=true`).

## P2-C05 — Résilience perte connexion (reconnexion/fallback < 3 s p95)
- [x] Campagne chaos protocole exécutée.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-bench.log` (`[PROTO-204] ... threshold<=3000ms => PASS`).
- [x] Export reconnexion versionné (`phase2-metrics.json`).  
  **Preuve unique:** `artifacts/phase2-exit/phase2-metrics.json` (`p2c05.reconnectMs.p95`).
- [x] p95 reconnexion/fallback < 3 s.  
  **Preuve unique:** `artifacts/phase2-exit/phase2-report.md` (résultat P2-C05).

## Convention de traçabilité des preuves
Chaque preuve doit référencer au moins un ticket de type:
- `PROTO-*`: latence, trames, reconnexion protocoles.
- `PATCH-*`: intégrité patch fixtures.
- `CUE-*`: commandes show et transitions critiques.
- `QA-*`: qualification, scénarios, verdict go/no-go.
