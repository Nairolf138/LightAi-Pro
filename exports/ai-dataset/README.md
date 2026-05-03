# AI Dataset Export (JSONL/Parquet)

## Privacy
- Suppression des PII directes (emails, user ids, texte libre sensible).
- Hash SHA-256 salé pour `operator_pseudo_id`, `session_id`, `suggestion_id`.

## Feature dictionary
- `event_type`: type d'événement standardisé.
- `event_version`: version du schéma analytics.
- `show_id`: identifiant de show (hashable en export externe si requis).
- `latency_ms`: latence UI→validation.
- `model` / `variant`: modèle IA et variante/prompt.
- `outcome`: issue métier (`accepted`, `accepted_partial`, `edited`, `rejected`, `fallback_provider`, `provider_error`, etc.).
