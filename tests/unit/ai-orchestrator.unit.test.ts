import { assert, test } from '../harness';
import { AiOrchestrator, SCHEMA_VERSION, type StructuredBriefContract } from '../../src/runtime/ai-orchestrator';
import type { AiProvider } from '../../src/runtime/ai-orchestrator/providers/types';

const input: StructuredBriefContract = {
  schemaVersion: SCHEMA_VERSION,
  brief: { style: 'concert', energy: { baseline: 'medium', targetPeak: 'high' }, tempo: { bpm: 128, syncOnBeat: true }, keyMoments: [], constraints: {} },
  context: { showId: 's1', operatorId: 'op1' },
  patchAudit: { fixtureCount: 10, riskFlags: [] },
};

const provider: AiProvider = {
  name: 'test',
  async generateSuggestions() {
    return { schemaVersion: SCHEMA_VERSION, suggestions: [{ id: 'x', variant: 'safe', title: 'x', confidence: 0.9, rationale: ['ok'], brief: input.brief }] };
  },
  async explainSuggestion(id) {
    return { schemaVersion: SCHEMA_VERSION, suggestionId: id, limitingFactors: [], decisionSources: ['provider'] };
  },
};

test('proposeCuePlan retourne provider quand valide', async () => {
  const orchestrator = new AiOrchestrator(provider, { timeoutMs: 100, maxRetries: 1, circuitBreakerThreshold: 2 });
  const result = await orchestrator.proposeCuePlan(input);
  assert.equal(result.suggestions[0].id, 'x');
});

test('proposeCuePlan fallback quand provider indisponible', async () => {
  const badProvider: AiProvider = { name: 'bad', generateSuggestions: async () => { throw new Error('down'); }, explainSuggestion: async () => null };
  const orchestrator = new AiOrchestrator(badProvider, { timeoutMs: 100, maxRetries: 0, circuitBreakerThreshold: 1 });
  const result = await orchestrator.proposeCuePlan(input);
  assert.equal(result.suggestions[0].id, 'fallback-safe');
});

test('proposeCuePlan fallback sur timeout', async () => {
  const slowProvider: AiProvider = { name: 'slow', generateSuggestions: async () => await new Promise((r) => setTimeout(() => r({ schemaVersion: SCHEMA_VERSION, suggestions: [] as never[] }), 50)), explainSuggestion: async () => null };
  const orchestrator = new AiOrchestrator(slowProvider, { timeoutMs: 10, maxRetries: 0, circuitBreakerThreshold: 1 });
  const result = await orchestrator.proposeCuePlan(input);
  assert.equal(result.suggestions.length, 3);
});
