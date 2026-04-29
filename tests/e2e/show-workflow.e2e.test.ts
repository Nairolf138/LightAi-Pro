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

test('Workflow critique: enchaînements rapides go/pause/go restent déterministes', () => {
  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'intro',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      introScene: {
        id: 'introScene',
        name: 'Intro',
        values: [{ universeId: '1', channel: 1, value: 100 }],
      },
      nextScene: {
        id: 'nextScene',
        name: 'Next',
        values: [{ universeId: '1', channel: 1, value: 220 }],
      },
    },
    cues: {
      intro: {
        id: 'intro',
        name: 'Intro Cue',
        sceneId: 'introScene',
        transition: { fadeInMs: 100, holdMs: 100, fadeOutMs: 0, follow: 'cue', followCueId: 'next' },
      },
      next: {
        id: 'next',
        name: 'Next Cue',
        sceneId: 'nextScene',
        transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' },
      },
    },
  };

  const controller = new ShowController(timeline);
  controller.go(0);
  controller.pause(40);
  const resumed = controller.go(50);

  assert.equal(resumed.activeCueId, 'intro');
  assert.equal(resumed.values['1:1'], 40);

  const afterTransition = controller.tick(260);
  assert.equal(afterTransition.activeCueId, 'next');
  assert.equal(afterTransition.values['1:1'], 220);

  const state = controller.getState();
  assert.equal(state.blackout, false);
  assert.equal(state.playing, true);
  assert.equal(state.historyCueIds[state.historyCueIds.length - 1], 'next');
});

test('Workflow critique: commandes concurrentes blackout/jump évitent les cues zombies', () => {
  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'a',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      sa: { id: 'sa', name: 'A', values: [{ universeId: '1', channel: 1, value: 180 }] },
      sb: { id: 'sb', name: 'B', values: [{ universeId: '1', channel: 1, value: 60 }] },
    },
    cues: {
      a: {
        id: 'a',
        name: 'Cue A',
        sceneId: 'sa',
        transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' },
      },
      b: {
        id: 'b',
        name: 'Cue B',
        sceneId: 'sb',
        transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' },
      },
    },
  };

  const controller = new ShowController(timeline);
  controller.go(0);
  controller.blackout(100);
  const jumpAfterBlackout = controller.jumpCue('b', 100);

  assert.equal(jumpAfterBlackout.activeCueId, 'b');
  assert.equal(jumpAfterBlackout.blackout, false);
  assert.equal(jumpAfterBlackout.values['1:1'], 60);

  const state = controller.getState();
  assert.equal(state.cursor.cueId, 'b');
  assert.equal(state.blackout, false);
  assert.equal(state.historyCueIds.filter((cueId) => cueId === 'a').length, 1);
  assert.equal(state.historyCueIds.filter((cueId) => cueId === 'b').length, 1);
});
