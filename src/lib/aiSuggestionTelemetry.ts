import { supabase } from './supabase';
import { observability } from './observability';

export type AiSuggestionEventType =
  | 'ai_suggestion_shown'
  | 'ai_suggestion_applied'
  | 'ai_suggestion_edited'
  | 'ai_suggestion_rejected'
  | 'ai_suggestion_session_outcome';

export interface AiSuggestionEventInput {
  eventType: AiSuggestionEventType;
  operatorId: string;
  sessionId: string;
  suggestionId: string;
  cueId?: string;
  context?: Record<string, unknown>;
  modelVersion: string;
  rulesetVersion: string;
  runtimeVersion: string;
  featureFlags: Record<string, boolean>;
  latencyMs?: number;
  patchErrorCountBefore?: number;
  patchErrorCountAfter?: number;
}

const encoder = new TextEncoder();
const TELEMETRY_SALT = import.meta.env.VITE_OPERATOR_HASH_SALT ?? 'lightai-local-salt';

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const pseudonymizeOperatorId = async (operatorId: string): Promise<string> => {
  const payload = encoder.encode(`${TELEMETRY_SALT}:${operatorId}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return toHex(new Uint8Array(digest));
};

export const emitAiSuggestionEvent = async (input: AiSuggestionEventInput): Promise<void> => {
  const operatorPseudoId = await pseudonymizeOperatorId(input.operatorId);
  const { error } = await supabase.from('ai_suggestion_events').insert([
    {
      event_type: input.eventType,
      operator_pseudo_id: operatorPseudoId,
      session_id: input.sessionId,
      suggestion_id: input.suggestionId,
      cue_id: input.cueId ?? null,
      context: input.context ?? {},
      model_version: input.modelVersion,
      ruleset_version: input.rulesetVersion,
      runtime_version: input.runtimeVersion,
      feature_flags: input.featureFlags,
      latency_ms: input.latencyMs ?? null,
      patch_error_count_before: input.patchErrorCountBefore ?? null,
      patch_error_count_after: input.patchErrorCountAfter ?? null,
    },
  ]);

  if (error) {
    observability.warn('ai-suggestion-telemetry', 'Failed to emit ai suggestion event', {
      reason: error.message,
      eventType: input.eventType,
    });
  }
};
