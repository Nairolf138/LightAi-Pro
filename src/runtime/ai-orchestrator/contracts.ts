import type { BriefStyle, StructuredBrief } from '../../core/show/brief-planner';

export const SCHEMA_VERSION = '1.0.0';

export interface StructuredBriefContract {
  schemaVersion: typeof SCHEMA_VERSION;
  brief: StructuredBrief;
  context: { showId: string; operatorId: string; locale?: string };
  patchAudit: { fixtureCount: number; riskFlags: string[] };
}

export type SuggestionVariant = 'safe' | 'balanced' | 'creative';

export interface CueSuggestion {
  id: string;
  variant: SuggestionVariant;
  title: string;
  confidence: number;
  rationale: string[];
  brief: Partial<StructuredBrief> & { style: BriefStyle };
}

export interface CueSuggestionSet {
  schemaVersion: typeof SCHEMA_VERSION;
  suggestions: CueSuggestion[];
}

export interface SafetyValidationReport {
  schemaVersion: typeof SCHEMA_VERSION;
  passed: boolean;
  issues: Array<{ code: string; severity: 'info' | 'warning' | 'error'; message: string }>;
}

export interface SuggestionTrace {
  schemaVersion: typeof SCHEMA_VERSION;
  suggestionId: string;
  limitingFactors: string[];
  decisionSources: string[];
}
