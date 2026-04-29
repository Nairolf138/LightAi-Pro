# Limitations techniques connues (publiques)

Dernière mise à jour : 29 avril 2026

## Pilotage et protocoles
- La validation terrain de tous les adaptateurs DMX USB n'est pas terminée.
- Le comportement de certains drivers dépend du runtime desktop et de la plateforme hôte.
- Les performances temps réel varient selon la charge CPU/GPU et le volume de fixtures.

## Collaboration cloud
- Les workflows de collaboration Supabase sont en cours de stabilisation pour des usages production intensifs.
- Les modes de résolution de conflit avancés ne couvrent pas encore tous les cas de fusion simultanée.

## Expérience produit
- Les modules immersifs/AR/VR sont expérimentaux et non disponibles sur tous les environnements.
- Certaines automatisations « IA » sont assistées par règles et ne constituent pas une autonomie complète.

## Exploitation
- La chaîne de release desktop (signature/notarization/rollback) est encore en industrialisation selon les cibles.
- Le projet ne remplace pas les procédures de sécurité spectacle: une supervision opérateur reste requise.

## Backlog de traitement des limitations

| Limitation ID | Limitation | Ticket(s) lié(s) | Impact utilisateur | Risque | Effort estimé | Owner | Cible phase | Critère de sortie (mesurable) |
|---|---|---|---|---|---|---|---|---|
| LIM-001 | Validation terrain incomplète des adaptateurs DMX USB | `FIELD-101`, `QA-114` | Risque d'incompatibilité en installation live, setup plus long sur site. | Élevé | 4 sprints | Tech Lead Hardware | P1 | 100% des adaptateurs de la shortlist validés sur 3 OS (Win/macOS/Linux) avec 0 défaut bloquant sur 50h de tests terrain cumulés. |
| LIM-002 | Dépendance des drivers au runtime desktop et à la plateforme hôte | `ENG-208`, `QA-121` | Comportements non déterministes entre postes opérateurs. | Élevé | 3 sprints | Eng Lead Desktop | P1 | Matrice de compatibilité runtime x OS couverte à 95% et taux d'échec driver < 1% sur 1 000 démarrages automatisés. |
| LIM-003 | Variabilité des performances temps réel selon charge CPU/GPU et volume de fixtures | `ENG-215`, `PROTO-077` | Latence perceptible sur scènes complexes, risque de désynchronisation. | Élevé | 5 sprints | Perf Lead | P1 | Latence DMX p95 <= 20 ms et jitter p95 <= 5 ms sur profil cible 8 univers / 2 000 fixtures pendant 30 min. |
| LIM-004 | Stabilisation incomplète des workflows de collaboration Supabase | `ENG-231`, `QA-133` | Conflits ou pertes de fluidité en édition multi-utilisateur intensive. | Moyen | 4 sprints | Cloud Lead | P2 | 99,5% des opérations collaboratives réussies sur test de charge 50 utilisateurs concurrents pendant 1h. |
| LIM-005 | Couverture partielle des modes de résolution de conflit avancés | `PROTO-083`, `ENG-236` | Résolutions manuelles fréquentes, risque d'erreurs de fusion. | Moyen | 3 sprints | Product Owner Collaboration | P2 | 100% des 25 scénarios de conflits critiques couverts et validés en QA avec taux de résolution automatique >= 90%. |
| LIM-006 | Modules immersifs/AR/VR expérimentaux selon environnement | `PROTO-091`, `PKG-044` | Fonctionnalités non disponibles pour une partie des utilisateurs. | Moyen | 5 sprints | XR Lead | P3 | Support validé sur 3 configurations matérielles cibles et crash rate session XR < 2% sur bêta de 200 sessions. |
| LIM-007 | Automatisations IA partiellement basées sur des règles | `PROTO-095`, `ENG-244` | Attentes utilisateur sur l'autonomie non satisfaites, besoin d'interventions manuelles. | Moyen | 4 sprints | AI Product Manager | P2 | 80% des scénarios d'automatisation catalogués exécutés sans intervention manuelle sur jeu de 120 cas de référence. |
| LIM-008 | Industrialisation incomplète de la chaîne release desktop (signature/notarization/rollback) | `PKG-052`, `QA-140` | Retards de livraison et risque de rollback non fiable en production. | Élevé | 3 sprints | Release Manager | P1 | 100% des builds desktop signés/notarisés et rollback validé en < 15 min sur Win/macOS pour 5 releases consécutives. |
| LIM-009 | Supervision opérateur toujours requise pour la sécurité spectacle | `FIELD-117`, `QA-146` | Impossible d'opérer en mode autonome, dépendance forte à l'exploitant. | Élevé | 2 sprints (documentation + garde-fous) | Safety Officer | P1 | 100% des workflows critiques bloqués sans confirmation opérateur et checklists sécurité signées sur 10 répétitions pilotes. |
