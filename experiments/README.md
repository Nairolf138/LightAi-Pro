# AI Experiments (reproductibles)

Ce dossier contient des scripts reproductibles pour évaluer les changements IA:

1. `generate-features.mjs`: construit des features à partir d'événements anonymisés.
2. `temporal-split.mjs`: crée un split temporel train/test déterministe.
3. `score-baseline.mjs`: exécute un scoring baseline (heuristiques + pseudo-LLM) et calcule des métriques comparables.
4. `run-eval.mjs`: pipeline bout-en-bout et génération d'un rapport signé dans `artifacts/ai-eval/`.

## Format données attendu

Entrée JSONL (`--input`) avec au minimum:

- `event_id` (string)
- `timestamp` (ISO-8601)
- `event_type` (string)
- `actor_id` (string anonymisé)
- `severity` (number optionnel)
- `label` (0/1)

## Exemple rapide

```bash
node experiments/run-eval.mjs \
  --input artifacts/ai-eval/sample-events.jsonl \
  --dataset-snapshot snapshot-2026-05-03 \
  --prompt-rules-version prompt-rules-v1
```
