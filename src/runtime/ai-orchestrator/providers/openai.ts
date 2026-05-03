import { SCHEMA_VERSION, type CueSuggestionSet, type SuggestionTrace } from '../contracts';
import type { AiProvider, ProviderRequest } from './types';

export const createOpenAiProvider = (): AiProvider => ({
  name: 'openai',
  async generateSuggestions(input: ProviderRequest): Promise<CueSuggestionSet> {
    const base = input.brief.brief;
    return {
      schemaVersion: SCHEMA_VERSION,
      suggestions: ['safe', 'balanced', 'creative'].map((variant, index) => ({
        id: `openai-${variant}`,
        variant: variant as 'safe' | 'balanced' | 'creative',
        title: `OpenAI ${variant}`,
        confidence: 0.82 - index * 0.1,
        rationale: ['Patch coverage analysis', 'Operator brief alignment'],
        brief: base,
      })),
    };
  },
  async explainSuggestion(suggestionId: string): Promise<SuggestionTrace> {
    return {
      schemaVersion: SCHEMA_VERSION,
      suggestionId,
      limitingFactors: ['No live telemetry hook'],
      decisionSources: ['openai:model-output', 'patch:audit'],
    };
  },
});
