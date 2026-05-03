import { readFileSync } from 'node:fs';
import { assert, test } from '../harness';

test('AI telemetry doc/schema/migration remain aligned', async () => {
  const doc = readFileSync('docs/telemetry/ai-suggestion-events.md', 'utf-8');
  const migration = readFileSync('supabase/migrations/20260503110000_ai_suggestion_standardized_schema.sql', 'utf-8');
  const telemetry = readFileSync('src/lib/aiSuggestionTelemetry.ts', 'utf-8');

  ['eventVersion', 'sessionId', 'showId', 'model', 'variant', 'outcome'].forEach((field) => {
    assert.equal(doc.includes(field), true);
  });

  ['event_version', 'show_id', 'model', 'variant', 'outcome'].forEach((column) => {
    assert.equal(migration.includes(column), true);
    assert.equal(telemetry.includes(column), true);
  });
});
