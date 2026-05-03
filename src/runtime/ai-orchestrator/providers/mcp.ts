import { SCHEMA_VERSION, type CueSuggestionSet, type SuggestionTrace } from '../contracts';
import type { AiProvider, ProviderRequest } from './types';

export const createMcpProvider = (): AiProvider => ({
  name: 'mcp',
  async generateSuggestions(input: ProviderRequest): Promise<CueSuggestionSet> {
    return {
      schemaVersion: SCHEMA_VERSION,
      suggestions: [
        {
          id: 'mcp-safe',
          variant: 'safe',
          title: 'MCP conservative baseline',
          confidence: 0.7,
          rationale: ['Known-safe baseline'],
          brief: input.brief.brief,
        },
      ],
    };
  },
  async explainSuggestion(suggestionId: string): Promise<SuggestionTrace | null> {
    return {
      schemaVersion: SCHEMA_VERSION,
      suggestionId,
      limitingFactors: ['Provider returned reduced set'],
      decisionSources: ['mcp:policy-engine'],
    };
  },
});
