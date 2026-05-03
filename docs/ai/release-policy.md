# AI Release Policy

## Objectif
Empêcher la régression de qualité lors des changements de règles IA / prompts.

## Règle de release (bloquante)
Aucune règle IA, prompt, ou logique de scoring ne peut être fusionnée sans **rapport d'évaluation minimale validé** dans `artifacts/ai-eval/`.

Un rapport valide doit inclure:
- `codeVersion` (SHA Git),
- `promptRulesVersion`,
- `datasetSnapshotId`,
- des métriques comparables (`accuracy`, `precision`, `recall`, `f1`) pour baseline heuristique et baseline LLM.

## Évaluation minimale
- Split temporel déterministe (train/test ordonné par timestamp).
- Baseline heuristique + baseline LLM.
- Signature de run unique: `<datasetSnapshotId>__<promptRulesVersion>__<sha12>`.

## Process recommandé
1. Exécuter `node experiments/run-eval.mjs ...`.
2. Vérifier les métriques et la cohérence du split.
3. Versionner le rapport JSON produit dans `artifacts/ai-eval/`.
4. Ouvrir PR avec mention de la signature de run.
