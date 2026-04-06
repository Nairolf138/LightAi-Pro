import {
  Cue,
  DEFAULT_UNIVERSE_SIZE,
  ShowState,
  Universe,
  type ChannelValue,
} from './types';

const clampChannelValue = (value: number): ChannelValue =>
  Math.max(0, Math.min(255, Math.round(value)));

const assertUniverseChannel = (universe: Universe, channel: number) => {
  if (!Number.isInteger(channel) || channel < 1 || channel > universe.size) {
    throw new Error(
      `Channel ${channel} is outside universe "${universe.id}" range 1..${universe.size}`,
    );
  }
};

const assertUniverseExists = (state: ShowState, universeId: string): Universe => {
  const universe = state.universes[universeId];
  if (!universe) {
    throw new Error(`Universe "${universeId}" not found`);
  }
  return universe;
};

const getCueStepDuration = (cue: Cue, stepIndex: number): number => {
  const step = cue.steps[stepIndex];
  if (!step) {
    return 0;
  }
  return Math.max(0, step.holdMs) + Math.max(0, step.fadeMs);
};

const getSceneValuesMap = (state: ShowState, sceneId: string): Map<string, ChannelValue> => {
  const scene = state.scenes[sceneId];
  if (!scene) {
    throw new Error(`Scene "${sceneId}" not found`);
  }

  const values = new Map<string, ChannelValue>();
  for (const value of scene.values) {
    const universe = assertUniverseExists(state, value.universeId);
    assertUniverseChannel(universe, value.channel);
    values.set(`${value.universeId}:${value.channel}`, clampChannelValue(value.value));
  }

  return values;
};

export const createShowState = (): ShowState => ({
  fixtures: {},
  universes: {
    default: {
      id: 'default',
      name: 'Default Universe',
      size: DEFAULT_UNIVERSE_SIZE,
      channels: {},
    },
  },
  scenes: {},
  cues: {},
  activeCue: null,
  currentSceneId: null,
  tick: 0,
});

export const setChannel = (
  state: ShowState,
  universeId: string,
  channel: number,
  value: number,
): ShowState => {
  const universe = assertUniverseExists(state, universeId);
  assertUniverseChannel(universe, channel);

  return {
    ...state,
    universes: {
      ...state.universes,
      [universeId]: {
        ...universe,
        channels: {
          ...universe.channels,
          [channel]: clampChannelValue(value),
        },
      },
    },
  };
};

export const applyScene = (state: ShowState, sceneId: string): ShowState => {
  const values = getSceneValuesMap(state, sceneId);

  let nextState = state;
  for (const [key, value] of values.entries()) {
    const [universeId, channelAsString] = key.split(':');
    nextState = setChannel(nextState, universeId, Number(channelAsString), value);
  }

  return {
    ...nextState,
    currentSceneId: sceneId,
  };
};

export const startCue = (state: ShowState, cueId: string, nowMs: number): ShowState => {
  const cue = state.cues[cueId];
  if (!cue) {
    throw new Error(`Cue "${cueId}" not found`);
  }
  if (cue.steps.length === 0) {
    throw new Error(`Cue "${cueId}" has no steps`);
  }

  const stateWithFirstStep = applyScene(state, cue.steps[0].sceneId);

  return {
    ...stateWithFirstStep,
    activeCue: {
      cueId,
      stepIndex: 0,
      startedAtMs: nowMs,
      stepStartedAtMs: nowMs,
    },
  };
};

export const stopCue = (state: ShowState): ShowState => ({
  ...state,
  activeCue: null,
});

export const tickCue = (state: ShowState, nowMs: number): ShowState => {
  if (!state.activeCue) {
    return {
      ...state,
      tick: state.tick + 1,
    };
  }

  const cue = state.cues[state.activeCue.cueId];
  if (!cue) {
    return stopCue({ ...state, tick: state.tick + 1 });
  }

  const duration = getCueStepDuration(cue, state.activeCue.stepIndex);
  if (duration <= 0 || nowMs - state.activeCue.stepStartedAtMs < duration) {
    return {
      ...state,
      tick: state.tick + 1,
    };
  }

  const nextStepIndex = state.activeCue.stepIndex + 1;
  if (nextStepIndex < cue.steps.length) {
    const withScene = applyScene(state, cue.steps[nextStepIndex].sceneId);
    return {
      ...withScene,
      activeCue: {
        ...state.activeCue,
        stepIndex: nextStepIndex,
        stepStartedAtMs: nowMs,
      },
      tick: state.tick + 1,
    };
  }

  if (!cue.loop) {
    return {
      ...stopCue(state),
      tick: state.tick + 1,
    };
  }

  const withLoopFirstScene = applyScene(state, cue.steps[0].sceneId);
  return {
    ...withLoopFirstScene,
    activeCue: {
      ...state.activeCue,
      stepIndex: 0,
      stepStartedAtMs: nowMs,
    },
    tick: state.tick + 1,
  };
};
