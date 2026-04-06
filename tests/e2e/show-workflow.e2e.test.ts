import { test, assert } from '../harness';
import { FixtureProfileRegistry } from '../../src/core/fixtures/registry';
import { FixturePatchEditor } from '../../src/core/fixtures/patch-editor';
import { patchRenderMappingToShowStateUniverses } from '../../src/core/fixtures/engine-mapper';
import { ShowController } from '../../src/core/show/controller';
import type { ShowTimeline } from '../../src/core/show/types';

test('Workflow critique: patch -> cue -> go -> blackout', () => {
  const registry = new FixtureProfileRegistry();
  registry.importProfiles([
    {
      format: 'lightai.fixture.v1',
      manufacturer: 'LightAI',
      model: 'Dimmer4',
      profileId: 'lightai-dimmer4',
      modes: [
        {
          id: '4ch',
          name: '4-channel',
          channels: [
            { key: 'dim1', name: 'Dim 1', type: 'intensity', defaultValue: 20 },
            { key: 'dim2', name: 'Dim 2', type: 'intensity', defaultValue: 30 },
            { key: 'dim3', name: 'Dim 3', type: 'intensity', defaultValue: 40 },
            { key: 'dim4', name: 'Dim 4', type: 'intensity', defaultValue: 50 },
          ],
        },
      ],
    },
  ]);

  const patch = new FixturePatchEditor(registry);
  patch.upsertFixture({
    id: 'fx-1',
    name: 'Face',
    profileId: 'lightai-dimmer4',
    modeId: '4ch',
    universe: 1,
    address: 1,
  });

  const mapping = patch.buildRenderMapping();
  const universes = patchRenderMappingToShowStateUniverses(mapping);
  assert.equal(universes['1'].channels[1], 20);
  assert.equal(universes['1'].channels[4], 50);

  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'intro',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      introScene: {
        id: 'introScene',
        name: 'Intro',
        values: [{ universeId: '1', channel: 1, value: 180 }],
      },
    },
    cues: {
      intro: {
        id: 'intro',
        name: 'Intro Cue',
        sceneId: 'introScene',
        transition: { fadeInMs: 0, holdMs: 2000, fadeOutMs: 0, follow: 'hold' },
      },
    },
  };

  const controller = new ShowController(timeline);
  const goSnapshot = controller.go(0);

  assert.equal(goSnapshot.activeCueId, 'intro');
  assert.equal(goSnapshot.values['1:1'], 180);

  const blackoutSnapshot = controller.blackout(500);
  assert.equal(blackoutSnapshot.blackout, true);
  assert.equal(blackoutSnapshot.values['1:1'], 0);
});
