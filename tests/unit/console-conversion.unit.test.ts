import { convertShowToConsole, getPrioritizedConsolesForV1 } from '../../src/core/show/console-conversion';
import type { CanonicalShowModel } from '../../src/core/show/canonical';
import { assert, test } from '../harness';

const buildShow = (): CanonicalShowModel => ({
  schemaVersion: '1.0.0',
  metadata: { showId: 'show-v1', title: 'V1 Show' },
  dmx: {
    universes: [{ id: 1 }],
    fixtureModes: [],
    fixtures: [],
  },
  attributesCatalog: [
    { id: 'dimmer', family: 'dimmer', label: 'Dimmer' },
    { id: 'focus', family: 'focus', label: 'Focus' },
  ],
  groups: [{ id: 'g1', name: 'Face', fixtureIds: ['fx1'] }],
  palettes: [
    {
      id: 'p-focus',
      name: 'Sharp Focus',
      kind: 'focus',
      values: [{ fixtureId: 'fx1', attributes: [{ attributeId: 'focus', value: 50, scale: 'percent' }] }],
    },
  ],
  cues: [
    {
      id: 'cue-1',
      number: '1',
      name: 'Intro',
      timing: { inMs: 155, outMs: 255, delayMs: 10 },
      parts: [
        {
          id: 'part-1',
          targets: [{ fixtureId: 'fx1', values: [{ attributeId: 'focus', value: 30, scale: 'percent' }] }],
        },
      ],
    },
  ],
  consoleMappings: [],
});

test('priorise 2 consoles V1 par région', () => {
  assert.deepEqual(getPrioritizedConsolesForV1('eu'), ['grandma3', 'chamsys']);
  assert.deepEqual(getPrioritizedConsolesForV1('uk'), ['chamsys', 'avolites']);
});

test('applique fallback explicite avec journal pour console sans focus palette', () => {
  const result = convertShowToConsole(buildShow(), { targetConsole: 'chamsys' });

  assert.equal(result.summary.convertedPalettes, 0);
  assert.ok(result.summary.warnings >= 2);
  assert.ok(result.journal.some((entry) => entry.scope === 'palette' && entry.fallbackApplied));

  const parsed = JSON.parse(result.exportArtifact.payload) as CanonicalShowModel;
  assert.equal(parsed.cues[0].timing.inMs, 200);
  assert.equal(parsed.cues[0].name, 'Cue Intro');
});

test('génère un export importable JSON + nommage pour grandMA3', () => {
  const result = convertShowToConsole(buildShow(), { targetConsole: 'grandma3', region: 'eu' });

  assert.equal(result.exportArtifact.format, 'json');
  assert.equal(result.exportArtifact.filename, 'show-v1-grandma3-import.json');

  const parsed = JSON.parse(result.exportArtifact.payload) as CanonicalShowModel;
  assert.equal(parsed.groups[0].name, 'Grp Face');
  assert.equal(parsed.palettes[0].name, 'Preset Sharp Focus');
  assert.equal(result.prioritizedConsoles[0], 'grandma3');
});
