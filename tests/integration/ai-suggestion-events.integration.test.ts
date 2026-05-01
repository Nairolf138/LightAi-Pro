import { applyNamingAssistant } from '../../src/core/show/preset-seeding';
import type { NamingAssistant } from '../../src/core/show/brief-planner';
import { assert, test } from '../harness';

test('AI suggestion events: shown/applied/rejected/edited are emitted on naming flow', async () => {
  const seed = {
    groups: [{ id: 'g1', name: 'Front', axis: 'position' as const, fixtureIds: ['fx1'], source: 'manual' as const }],
    palettes: [{
      id: 'p1',
      name: 'Color base',
      kind: 'color' as const,
      values: [{ fixtureId: 'fx1', attributes: { color: 'red' } }],
      coverage: 'global' as const,
      source: 'fixture-capabilities' as const,
    }],
  };

  const assistant: NamingAssistant = {
    suggestName: async ({ kind }) => {
      if (kind === 'group') {
        return { readableName: 'Front' };
      }
      return { readableName: 'Warm Wash' };
    },
  };

  const events: string[] = [];
  await applyNamingAssistant(seed, assistant, async (event) => {
    events.push(event.eventType);
  });

  assert.deepEqual(events, [
    'ai_suggestion_shown',
    'ai_suggestion_rejected',
    'ai_suggestion_shown',
    'ai_suggestion_applied',
  ]);
});
