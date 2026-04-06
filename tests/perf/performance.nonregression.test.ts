import { test, assert } from '../harness';
import { FixtureProfileRegistry } from '../../src/core/fixtures/registry';
import { FixturePatchEditor } from '../../src/core/fixtures/patch-editor';
import { patchRenderMappingToShowStateUniverses } from '../../src/core/fixtures/engine-mapper';
import { showStateToUniverseFrames } from '../../src/core/protocols/selector';

const PERF_FIXTURES = 1000;

test('Non-régression perf: charge fixtures/universes', () => {
  const registry = new FixtureProfileRegistry();
  registry.importProfiles([
    {
      format: 'lightai.fixture.v1',
      manufacturer: 'Bench',
      model: 'Fixture-8ch',
      profileId: 'bench-8ch',
      modes: [
        {
          id: '8ch',
          name: '8-channel',
          channels: Array.from({ length: 8 }, (_, idx) => ({
            key: `c${idx + 1}`,
            name: `Channel ${idx + 1}`,
            type: 'intensity' as const,
            defaultValue: idx * 10,
          })),
        },
      ],
    },
  ]);

  const patch = new FixturePatchEditor(registry);
  for (let index = 0; index < PERF_FIXTURES; index += 1) {
    patch.upsertFixture({
      id: `fx-${index}`,
      name: `Fixture ${index}`,
      profileId: 'bench-8ch',
      modeId: '8ch',
      universe: Math.floor(index / 60) + 1,
      address: (index % 60) * 8 + 1,
    });
  }

  const startedAt = Date.now();
  const mapping = patch.buildRenderMapping();
  const universes = patchRenderMappingToShowStateUniverses(mapping);
  const frames = showStateToUniverseFrames({ universes });
  const elapsedMs = Date.now() - startedAt;

  assert.equal(Object.keys(frames).length > 0, true);
  assert.equal(mapping.channelMappings.length, PERF_FIXTURES * 8);
  assert.ok(elapsedMs < 1500, `Perf budget dépassé: ${elapsedMs}ms (max 1500ms)`);
});
