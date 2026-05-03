import { planFromBrief, type BriefPlanningResult } from '../../core/show/brief-planner';
import type { CanonicalShowModel } from '../../core/show/canonical';
import {
  SCHEMA_VERSION,
  type CueSuggestionSet,
  type SafetyValidationReport,
  type StructuredBriefContract,
  type SuggestionTrace,
} from './contracts';
import type { AiProvider } from './providers/types';

export interface OrchestratorOptions {
  timeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);

export class AiOrchestrator {
  private failures = 0;
  constructor(private provider: AiProvider, private options: OrchestratorOptions) {}

  async generateStructuredBrief(input: StructuredBriefContract): Promise<StructuredBriefContract> {
    return { ...input, schemaVersion: SCHEMA_VERSION };
  }

  async proposeCuePlan(input: StructuredBriefContract): Promise<CueSuggestionSet> {
    if (this.failures >= this.options.circuitBreakerThreshold) {
      return this.localFallback(input, 'Circuit breaker open');
    }

    for (let i = 0; i <= this.options.maxRetries; i += 1) {
      try {
        const result = await withTimeout(this.provider.generateSuggestions({ brief: input }), this.options.timeoutMs);
        if (!result.suggestions?.length) throw new Error('invalid provider response');
        this.failures = 0;
        return result;
      } catch (error) {
        this.failures += 1;
        if (i === this.options.maxRetries) {
          return this.localFallback(input, (error as Error).message);
        }
      }
    }
    return this.localFallback(input, 'unexpected');
  }

  async explainSuggestion(id: string): Promise<SuggestionTrace> {
    const trace = await this.provider.explainSuggestion(id);
    return (
      trace ?? {
        schemaVersion: SCHEMA_VERSION,
        suggestionId: id,
        limitingFactors: ['No trace from provider'],
        decisionSources: ['fallback:local'],
      }
    );
  }

  validateSafety(input: StructuredBriefContract): SafetyValidationReport {
    const issues = [] as SafetyValidationReport['issues'];
    if ((input.brief.constraints.maxIntensityPercent ?? 100) > 95) {
      issues.push({ code: 'INTENSITY_HIGH', severity: 'warning', message: 'Max intensity above recommended limit.' });
    }
    return { schemaVersion: SCHEMA_VERSION, passed: issues.length === 0, issues };
  }

  planFromSuggestedBrief(
    suggestionSet: CueSuggestionSet,
    patch: Pick<CanonicalShowModel, 'dmx' | 'attributesCatalog'>,
  ): BriefPlanningResult[] {
    return suggestionSet.suggestions.map((suggestion) => planFromBrief(suggestion.brief, patch));
  }

  private localFallback(input: StructuredBriefContract, reason: string): CueSuggestionSet {
    return {
      schemaVersion: SCHEMA_VERSION,
      suggestions: ['safe', 'balanced', 'creative'].map((variant, index) => ({
        id: `fallback-${variant}`,
        variant: variant as 'safe' | 'balanced' | 'creative',
        title: `Fallback ${variant}`,
        confidence: 0.45 - index * 0.05,
        rationale: [`Fallback activé: ${reason}`],
        brief: input.brief,
      })),
    };
  }
}
