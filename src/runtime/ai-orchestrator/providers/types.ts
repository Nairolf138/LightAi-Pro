import type { CueSuggestionSet, StructuredBriefContract, SuggestionTrace } from '../contracts';

export interface ProviderRequest {
  brief: StructuredBriefContract;
  timeoutMs?: number;
}

export interface AiProvider {
  name: string;
  generateSuggestions(input: ProviderRequest): Promise<CueSuggestionSet>;
  explainSuggestion(suggestionId: string): Promise<SuggestionTrace | null>;
}
