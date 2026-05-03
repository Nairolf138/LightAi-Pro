import { createHash } from 'node:crypto';

const HASH_SALT = process.env.AI_DATASET_SALT ?? 'lightai-anon-salt';

export const hashSensitive = (value: string): string => createHash('sha256').update(`${HASH_SALT}:${value}`).digest('hex');

export const anonymizeEventBatch = (events: Record<string, unknown>[]) =>
  events.map((event) => ({
    ...event,
    operator_pseudo_id: event.operator_pseudo_id ? hashSensitive(String(event.operator_pseudo_id)) : undefined,
    session_id: event.session_id ? hashSensitive(String(event.session_id)) : undefined,
    suggestion_id: event.suggestion_id ? hashSensitive(String(event.suggestion_id)) : undefined,
    context: {
      ...(event.context as Record<string, unknown> | undefined),
      pii_removed: true,
    },
  }));
