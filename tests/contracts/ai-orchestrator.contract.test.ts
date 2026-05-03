import { readFileSync } from 'node:fs';
import { assert, test } from '../harness';
import { SCHEMA_VERSION, type CueSuggestionSet, type StructuredBriefContract } from '../../src/runtime/ai-orchestrator';

type JsonSchema = { type?: string; required?: string[]; properties?: Record<string, JsonSchema>; items?: JsonSchema; enum?: unknown[]; const?: unknown };
const matches = (schema: JsonSchema, value: unknown): boolean => {
  if (schema.const !== undefined) return value === schema.const;
  if (schema.enum) return schema.enum.includes(value);
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in obj)) return false;
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in obj && !matches(child, obj[key])) return false;
    }
    return true;
  }
  if (schema.type === 'array') return Array.isArray(value) && value.every((it) => (schema.items ? matches(schema.items, it) : true));
  if (schema.type === 'string') return typeof value === 'string';
  if (schema.type === 'number') return typeof value === 'number';
  return true;
};

const structuredBriefSchema = JSON.parse(readFileSync('src/runtime/ai-orchestrator/schemas/structured-brief.schema.json', 'utf-8')) as JsonSchema;
const cueSuggestionSchema = JSON.parse(readFileSync('src/runtime/ai-orchestrator/schemas/cue-suggestion-set.schema.json', 'utf-8')) as JsonSchema;

const structuredBrief: StructuredBriefContract = { schemaVersion: SCHEMA_VERSION, brief: { style: 'club', energy: { baseline: 'medium', targetPeak: 'high' }, tempo: { bpm: 128, syncOnBeat: true }, keyMoments: [], constraints: {} }, context: { showId: 'show-1', operatorId: 'operator-1' }, patchAudit: { fixtureCount: 8, riskFlags: [] } };
const suggestionSet: CueSuggestionSet = { schemaVersion: SCHEMA_VERSION, suggestions: [{ id: 's1', variant: 'safe', title: 'safe', confidence: 0.8, rationale: ['ok'], brief: structuredBrief.brief }] };

test('StructuredBrief respecte le contrat JSON schema', () => {
  assert.equal(matches(structuredBriefSchema, structuredBrief), true);
});

test('CueSuggestionSet respecte le contrat JSON schema', () => {
  assert.equal(matches(cueSuggestionSchema, suggestionSet), true);
});
