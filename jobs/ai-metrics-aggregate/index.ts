export interface AiMetricEvent {
  eventType: 'ai_suggestion_shown' | 'ai_suggestion_applied' | 'ai_suggestion_edited' | 'ai_suggestion_rejected';
  showId: string;
  latencyMs?: number;
  outcome: string;
  context?: Record<string, unknown>;
}

export const aggregateAiMetrics = (events: AiMetricEvent[]) => {
  const shown = events.filter((e) => e.eventType === 'ai_suggestion_shown');
  const accepted = events.filter((e) => ['accepted', 'accepted_partial'].includes(e.outcome));
  const byShowType = shown.reduce<Record<string, { shown: number; accepted: number }>>((acc, event) => {
    const showType = String(event.context?.showType ?? 'default');
    if (!acc[showType]) acc[showType] = { shown: 0, accepted: 0 };
    acc[showType].shown += 1;
    return acc;
  }, {});

  accepted.forEach((event) => {
    const showType = String(event.context?.showType ?? 'default');
    if (!byShowType[showType]) byShowType[showType] = { shown: 0, accepted: 0 };
    byShowType[showType].accepted += 1;
  });

  const avgValidationDelayMs = accepted.length
    ? accepted.reduce((sum, event) => sum + (event.latencyMs ?? 0), 0) / accepted.length
    : 0;
  const postAcceptanceEdits = events.filter((e) => e.outcome === 'edited').length;
  const providerFailures = events.filter((e) => ['fallback_provider', 'provider_error'].includes(e.outcome)).length;

  return {
    acceptanceRateGlobal: shown.length ? accepted.length / shown.length : 0,
    acceptanceRateByShowType: Object.fromEntries(
      Object.entries(byShowType).map(([key, value]) => [key, value.shown ? value.accepted / value.shown : 0]),
    ),
    avgValidationDelayMs,
    postAcceptanceRetouchRatio: accepted.length ? postAcceptanceEdits / accepted.length : 0,
    providerFailureFallbackRate: events.length ? providerFailures / events.length : 0,
  };
};
