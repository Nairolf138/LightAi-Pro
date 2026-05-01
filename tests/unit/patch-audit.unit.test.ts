import { test, assert } from '../harness';
import { runPatchAudit } from '../../src/ai/patch-audit';
import { FixtureProfileRegistry } from '../../src/core/fixtures/registry';

const createRegistry = (): FixtureProfileRegistry => {
  const registry = new FixtureProfileRegistry();
  registry.importProfiles([
    {
      format: 'lightai.fixture.v1',
      manufacturer: 'LightAi',
      model: 'Wash 19',
      profileId: 'wash-19',
      modes: [
        {
          id: 'mode-10ch',
          name: '10ch',
          channels: Array.from({ length: 10 }, (_, index) => ({
            key: `ch-${index + 1}`,
            name: `Channel ${index + 1}`,
            type: 'custom' as const,
          })),
        },
      ],
    },
  ]);
  return registry;
};

test('Patch audit: génère issues/warnings/propositions avec codes stables', () => {
  const registry = createRegistry();
  const result = runPatchAudit(
    [
      { id: 'fx-1', name: 'FX1', profileId: 'wash-19', modeId: 'mode-10ch', universe: 1, address: 1 },
      { id: 'fx-2', name: 'FX2', profileId: 'wash-19', modeId: 'mode-10ch', universe: 1, address: 5 },
      { id: 'fx-3', name: 'FX3', profileId: 'wash-19', modeId: 'bad-mode', universe: 1, address: 100 },
      { id: 'fx-4', name: 'FX4', profileId: 'wash-19', modeId: 'mode-10ch', universe: 1, address: 510 },
    ],
    registry,
  );

  assert.ok(result.issues.some((issue) => issue.code === 'PA_DMX_ADDRESS_CONFLICT'));
  assert.ok(result.issues.some((issue) => issue.code === 'PA_FIXTURE_MODE_INCONSISTENT'));
  assert.ok(result.issues.some((issue) => issue.code === 'PA_CHANNEL_OUT_OF_RANGE'));
  assert.ok(result.warnings.some((warning) => warning.code === 'PA_UNIVERSE_OVERLAP'));
  assert.ok(result.propositions.length > 0);
  assert.ok(result.severity.global > 0);
  assert.ok(result.severity.byUniverse[1] > 0);
});

test('Patch audit: ingestion CSV supportée', () => {
  const registry = createRegistry();
  const csv = [
    'id,name,profileId,modeId,universe,address',
    'fx-csv-1,CSV One,wash-19,mode-10ch,2,1',
    'fx-csv-2,CSV Two,wash-19,mode-10ch,2,8',
  ].join('\n');

  const result = runPatchAudit(csv, registry);
  assert.equal(result.issues.length > 0, true);
  assert.ok(result.severity.byUniverse[2] >= 0);
});
