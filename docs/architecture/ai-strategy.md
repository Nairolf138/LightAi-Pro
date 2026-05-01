# Architecture IA — LLM + heuristiques vs Deep Learning custom

## Objectif
Définir une trajectoire d'architecture IA pragmatique pour LightAI-Pro, en privilégiant la valeur produit mesurable, la sécurité opérationnelle en contexte live et la maîtrise des coûts d'exploitation.

## 1) Comparatif architecture: LLM + heuristiques vs DL custom

### Option A — LLM + heuristiques (recommandé par défaut)
**Principe**
- Un LLM sert à l'interprétation (brief opérateur, normalisation sémantique, priorisation).
- Un moteur heuristique déterministe applique les règles métier critiques (sécurité, compatibilité fixtures, contraintes timing/live).
- Les sorties sont tracées et explicables via des règles et scores de confiance.

**Forces**
- Time-to-market rapide (faible cycle d'itération pour améliorer prompts/règles).
- Risque opérationnel réduit (règles déterministes gardent la main sur les décisions critiques).
- Coûts initiaux faibles (pas de pipeline d'entraînement lourd au démarrage).
- Bonne maintenabilité produit (ajout de règles métier sans réentraîner un modèle).

**Limites**
- Qualité parfois hétérogène sur des cas très spécifiques au domaine lumière.
- Performance plafonnée si les signaux métier implicites sont trop complexes pour des règles.
- Dépendance partielle à des modèles tiers pour certaines capacités de compréhension.

### Option B — Deep Learning custom (spécifique domaine)
**Principe**
- Modèle entraîné sur des données historiques annotées LightAI-Pro (patch, cues, retouches opérateur, contexte show).
- Inférence spécialisée pour des tâches ciblées (ranking de suggestions, génération de cues contextualisée, détection d'erreurs complexes).

**Forces**
- Potentiel de gains supérieurs sur tâches répétitives à forte structure métier.
- Meilleure adaptation au style opérateur et aux distributions réelles des shows.
- Moins de dépendance à des comportements génériques de modèles externes.

**Limites**
- Coût élevé de collecte/annotation/gouvernance des données.
- Coût infra (entraînement + serving + MLOps) et dette opérationnelle durable.
- Risques de dérive modèle et besoin d'évaluation continue.
- Time-to-market plus long avant un ROI clair.

## 2) Critère go / no-go pour lancer un DL custom

Le passage en DL custom est **GO** uniquement si les trois portes ci-dessous sont validées simultanément. Sinon: **NO-GO** et maintien du stack LLM + heuristiques.

### Porte A — Volume et qualité des données annotées
- Minimum **50 000 exemples exploitables** sur la tâche cible (après nettoyage), avec représentation multi-shows/multi-opérateurs.
- Taux d'annotation cohérente inter-annotateurs ≥ **0,8** (kappa ou métrique équivalente).
- Jeu d'évaluation figé, non contaminé, couvrant les scénarios critiques live.

### Porte B — Gain produit mesurable
- En offline: amélioration relative ≥ **+15 %** sur la métrique primaire métier (ex: taux d'acceptation des cues, réduction retouches).
- En shadow/canary contrôlé: gain confirmé sur au moins **2 releases** consécutives.
- Aucune dégradation des garde-fous sécurité (zéro régression sur règles bloquantes).

### Porte C — Coût infra soutenable
- Coût total mensuel (entraînement amorti + inférence + observabilité) ≤ **30 %** de la valeur opérationnelle générée.
- Latence p95 compatible usage live (objectif produit inchangé).
- Équipe capable d'opérer le cycle MLOps (monitoring dérive, rollback modèle, réentraînement).

## 3) Télémétrie produit à implémenter dès maintenant

Objectif: collecter des signaux d'apprentissage utiles **sans** bloquer le produit, tout en conservant traçabilité et gouvernance.

### Événements minimum à tracer
- `ai_suggestion_shown` (contexte: type de tâche, version modèle/règles, confiance).
- `ai_suggestion_applied` (application brute).
- `ai_suggestion_edited` (diff avant/après + ampleur de retouche).
- `ai_suggestion_rejected` (raison catégorisée).
- `ai_session_outcome` (temps gagné estimé, satisfaction opérateur, incident éventuel).

### Schéma de données recommandé
- IDs stables: `project_id`, `show_id`, `cue_id`, `operator_id` pseudonymisé.
- Contexte technique: `runtime_version`, `ruleset_version`, `model_version`, `feature_flags`.
- Qualité: `confidence`, `latency_ms`, `validation_state`, `safety_checks_passed`.
- Feedback explicite: note opérateur, tags de motif de rejet, commentaire court.

### Gouvernance
- Minimisation des données collectées et pseudonymisation systématique.
- Rétention différenciée: événements bruts courts, agrégats longs.
- Journal d'accès et revue périodique des usages d'entraînement.

## 4) Plan d'expérimentation offline avant toute prod DL

Aucun déploiement DL en production sans une phase d'évaluation offline structurée.

### Étapes
1. **Cadre d'évaluation figé**
   - Définir tâches, métriques primaires/secondaires, seuils de succès et seuils d'abandon.
2. **Jeux historiques versionnés**
   - Split temporel strict (train/validation/test) pour limiter fuite d'information.
3. **Baselines obligatoires**
   - Comparer au système courant LLM + heuristiques (baseline principale) et à une baseline naïve.
4. **Analyse d'erreurs**
   - Segmenter par type de show, opérateur, complexité patch, conditions live.
5. **Revue go/no-go**
   - Appliquer les portes A/B/C ci-dessus; documenter décision signée produit + technique.

### Livrables attendus
- Rapport d'évaluation offline versionné (métriques + analyses de risques).
- Recommandation explicite: `NO-GO`, `GO limité (shadow)`, ou `GO canary`.
- Plan de rollback et critères d'arrêt en cas de dérive post-déploiement.

## Décision architecture recommandée (état actuel)
- **Court terme**: renforcer l'approche **LLM + heuristiques**.
- **Moyen terme**: construire la télémétrie et le dataset supervisé.
- **Long terme**: envisager DL custom uniquement après validation stricte des critères go/no-go.

## 5) Contrat du modèle interne de capacités fixtures

Pour aligner l'IA (suggestions palettes/groupes) avec le modèle canonique show (`docs/architecture/show-canonical-model.md`), le moteur fixture expose désormais un schéma interne normalisé `capabilities/channelMap/constraints`.

### Structure contractuelle
- `capabilities`: dictionnaire par `attributeId` (ex: `color.rgb`, `position.pan`) incluant canaux, résolution et plage.
- `channelMap`: index strict 1..N des canaux DMX du mode, avec type de famille, attribut résolu, plage et valeur par défaut.
- `constraints`: espace réservé pour contraintes déclaratives explicites (types/ranges/dépendances de mode), complété par les validateurs.

### Conversion
- Source: définitions existantes `FixtureProfile` / `FixtureProfileMode` (`lightai.fixture.v1`).
- Convertisseur: `toCapabilitySchema(profile, mode)`.
- Garanties: conservation des IDs de profil/mode, attribution canonique stable, résolution/ranges dérivées de la définition brute.

### Validation stricte
Le validateur `validateCapabilitySchema(schema)` produit un rapport d'incohérence structuré (code, sévérité, message, canal) couvrant:
- types de canal invalides,
- plages incohérentes (`min > max`),
- valeurs par défaut hors plage,
- dépendances fine/coarse absentes (mode dependency).

### Index de recherche précalculés
`buildCapabilityIndexes(schema)` expose des index optimisés pour la suggestion IA:
- `byAttribute`: recherche directe attribut -> canaux.
- `byFamily`: regroupement rapide par famille (`color`, `position`, `beam`, etc.).
- `byDmxRange`: segments triés pour heuristiques basées sur plages DMX.

### Compatibilité inter-fixtures
- La normalisation garantit un contrat identique entre fixtures hétérogènes.
- Les tests de conversion/validation/indexation servent de garde-fou de compatibilité entre fixtures et modes.
