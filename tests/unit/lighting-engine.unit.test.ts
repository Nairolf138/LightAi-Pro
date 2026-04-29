import { test, assert } from '../harness';
import { FrameScheduler } from '../../src/core/lighting-engine/scheduler';
import { createInitialShowRunState, evaluateTimeline } from '../../src/core/show/executor';
import { ShowController } from '../../src/core/show/controller';
import { patchRenderMappingToShowStateUniverses } from '../../src/core/fixtures/engine-mapper';
import { showStateToUniverseFrames } from '../../src/core/protocols/selector';
import type { ShowTimeline } from '../../src/core/show/types';

test('FrameScheduler traite les ticks en rattrapage', () => {
  let now = 0;
  const ticks: number[] = [];
  const scheduler = new FrameScheduler({
    tickMs: 20,
    onTick: (tickAt) => ticks.push(tickAt),
    deps: {
      now: () => now,
      schedule: () => 1,
      cancel: () => undefined,
    },
  });

  scheduler.start(0);
  now = 65;
  const count = scheduler.step(now);

  assert.equal(count, 3);
  assert.deepEqual(ticks, [20, 40, 60]);
});

test('Transitions: fade in / hold / fade out dans evaluateTimeline', () => {
  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'cue-a',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      s1: { id: 's1', name: 'Warm', values: [{ universeId: '1', channel: 1, value: 100 }] },
    },
    cues: {
      'cue-a': {
        id: 'cue-a',
        name: 'A',
        sceneId: 's1',
        transition: { fadeInMs: 1000, holdMs: 1000, fadeOutMs: 1000, follow: 'hold' },
      },
    },
  };

  const baseState = createInitialShowRunState();
  const playing = {
    ...baseState,
    playing: true,
    anchorStartedAtMs: 0,
    cursor: { cueId: 'cue-a', chaseId: null, chaseIndex: -1, elapsedMs: 0 },
    historyCueIds: ['cue-a'],
  };

  const at500 = evaluateTimeline(timeline, playing, 500).snapshot.values['1:1'];
  const at1500 = evaluateTimeline(timeline, playing, 1500).snapshot.values['1:1'];
  const at2500 = evaluateTimeline(timeline, playing, 2500).snapshot.values['1:1'];

  assert.equal(at500, 50);
  assert.equal(at1500, 100);
  assert.equal(at2500, 50);
});

test('Mapping canaux: PatchRenderMapping -> univers -> frames', () => {
  const universes = patchRenderMappingToShowStateUniverses({
    channelMappings: [],
    universeFrames: {
      1: [0, 128, 0, 255],
      2: [10, 0],
    },
  });

  const frames = showStateToUniverseFrames({ universes });
  assert.deepEqual(frames[1], [0, 128, 0, 255]);
  assert.deepEqual(frames[2], [10, 0]);
});

test('Transitions interrompues: follow blackout donne un état final déterministe', () => {
  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'cue-a',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      s1: { id: 's1', name: 'Warm', values: [{ universeId: '1', channel: 1, value: 200 }] },
    },
    cues: {
      'cue-a': {
        id: 'cue-a',
        name: 'A',
        sceneId: 's1',
        transition: { fadeInMs: 0, holdMs: 100, fadeOutMs: 0, follow: 'blackout' },
      },
    },
  };

  const playing = {
    ...createInitialShowRunState(),
    playing: true,
    anchorStartedAtMs: 0,
    cursor: { cueId: 'cue-a', chaseId: null, chaseIndex: -1, elapsedMs: 0 },
    historyCueIds: ['cue-a'],
  };

  const evaluated = evaluateTimeline(timeline, playing, 120);

  assert.equal(evaluated.state.playing, false);
  assert.equal(evaluated.state.cursor.cueId, null);
  assert.equal(evaluated.snapshot.blackout, true);
  assert.deepEqual(evaluated.snapshot.values, {});
});

test('Ordre incohérent: back avant go reste stable et sans cue zombie', () => {
  const timeline: ShowTimeline = {
    version: 1,
    entryCueId: 'intro',
    output: { activeDriver: 'simulator', simulator: { kind: 'simulator' } },
    chases: {},
    scenes: {
      introScene: { id: 'introScene', name: 'Intro', values: [{ universeId: '1', channel: 1, value: 90 }] },
    },
    cues: {
      intro: {
        id: 'intro',
        name: 'Intro Cue',
        sceneId: 'introScene',
        transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' },
      },
    },
  };

  const controller = new ShowController(timeline);
  const backSnapshot = controller.back(0);

  assert.equal(backSnapshot.activeCueId, 'intro');
  assert.equal(backSnapshot.blackout, false);

  const state = controller.getState();
  assert.equal(state.cursor.cueId, 'intro');
  assert.equal(state.historyCueIds.length, 0);
});
