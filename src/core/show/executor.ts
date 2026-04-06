import type {
  Chase,
  Cue,
  Scene,
  ShowRunState,
  ShowTimeline,
  TimelineSnapshot,
} from './types';

const clamp = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const toSceneMap = (scene?: Scene): Map<string, number> => {
  const map = new Map<string, number>();
  if (!scene) {
    return map;
  }

  for (const value of scene.values) {
    map.set(`${value.universeId}:${value.channel}`, clamp(value.value));
  }

  return map;
};

const mergeKeys = (a: Map<string, number>, b: Map<string, number>): string[] => {
  const keys = new Set<string>();
  for (const key of a.keys()) keys.add(key);
  for (const key of b.keys()) keys.add(key);
  return Array.from(keys.values());
};

const blendScenes = (
  from: Map<string, number>,
  to: Map<string, number>,
  ratio: number,
): Record<string, number> => {
  const r = Math.max(0, Math.min(1, ratio));
  const values: Record<string, number> = {};
  for (const key of mergeKeys(from, to)) {
    const fromValue = from.get(key) ?? 0;
    const toValue = to.get(key) ?? 0;
    values[key] = clamp(fromValue + (toValue - fromValue) * r);
  }
  return values;
};

const blackoutFrame = (values: Record<string, number>): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const key of Object.keys(values)) {
    out[key] = 0;
  }
  return out;
};

const cueDuration = (cue: Cue): number =>
  Math.max(0, cue.transition.fadeInMs) +
  Math.max(0, cue.transition.holdMs) +
  Math.max(0, cue.transition.fadeOutMs);

const previousCueId = (history: string[]): string | null => {
  if (history.length < 2) {
    return null;
  }
  return history[history.length - 2] ?? null;
};

const resolveNextFromChase = (
  chase: Chase,
  currentCueId: string,
): { cueId: string | null; chaseIndex: number } | null => {
  const index = chase.cueIds.indexOf(currentCueId);
  if (index < 0) {
    return null;
  }

  const nextIndex = index + 1;
  if (nextIndex < chase.cueIds.length) {
    return {
      cueId: chase.cueIds[nextIndex],
      chaseIndex: nextIndex,
    };
  }

  if (!chase.loop || chase.cueIds.length === 0) {
    return { cueId: null, chaseIndex: -1 };
  }

  return {
    cueId: chase.cueIds[0],
    chaseIndex: 0,
  };
};

const resolveFollow = (
  timeline: ShowTimeline,
  state: ShowRunState,
): { cueId: string | null; chaseId: string | null; chaseIndex: number } => {
  const cueId = state.cursor.cueId;
  if (!cueId) {
    return { cueId: null, chaseId: null, chaseIndex: -1 };
  }

  const cue = timeline.cues[cueId];
  if (!cue) {
    return { cueId: null, chaseId: null, chaseIndex: -1 };
  }

  if (state.cursor.chaseId) {
    const chase = timeline.chases[state.cursor.chaseId];
    if (chase) {
      const nextInChase = resolveNextFromChase(chase, cueId);
      if (nextInChase) {
        return {
          cueId: nextInChase.cueId,
          chaseId: nextInChase.cueId ? chase.id : null,
          chaseIndex: nextInChase.chaseIndex,
        };
      }
    }
  }

  switch (cue.transition.follow) {
    case 'hold':
      return { cueId, chaseId: state.cursor.chaseId, chaseIndex: state.cursor.chaseIndex };
    case 'stop':
    case 'blackout':
      return { cueId: null, chaseId: null, chaseIndex: -1 };
    case 'cue':
      return {
        cueId: cue.transition.followCueId ?? null,
        chaseId: null,
        chaseIndex: -1,
      };
    case 'chase': {
      const chase = cue.transition.followChaseId
        ? timeline.chases[cue.transition.followChaseId]
        : undefined;
      if (!chase || chase.cueIds.length === 0) {
        return { cueId: null, chaseId: null, chaseIndex: -1 };
      }
      return {
        cueId: chase.cueIds[0],
        chaseId: chase.id,
        chaseIndex: 0,
      };
    }
    case 'next': {
      const cueIds = Object.keys(timeline.cues);
      const currentIndex = cueIds.indexOf(cueId);
      if (currentIndex < 0 || currentIndex + 1 >= cueIds.length) {
        return { cueId: null, chaseId: null, chaseIndex: -1 };
      }
      return {
        cueId: cueIds[currentIndex + 1],
        chaseId: null,
        chaseIndex: -1,
      };
    }
    default:
      return { cueId: null, chaseId: null, chaseIndex: -1 };
  }
};

const ensureCursorCue = (timeline: ShowTimeline, state: ShowRunState): ShowRunState => {
  if (state.cursor.cueId || !timeline.entryCueId) {
    return state;
  }

  return {
    ...state,
    cursor: {
      ...state.cursor,
      cueId: timeline.entryCueId,
      elapsedMs: 0,
    },
    historyCueIds: [...state.historyCueIds, timeline.entryCueId],
  };
};

export const createInitialShowRunState = (): ShowRunState => ({
  cursor: {
    cueId: null,
    chaseId: null,
    chaseIndex: -1,
    elapsedMs: 0,
  },
  playing: false,
  pausedAtMs: null,
  anchorStartedAtMs: null,
  historyCueIds: [],
  blackout: false,
});

export const evaluateTimeline = (
  timeline: ShowTimeline,
  state: ShowRunState,
  nowMs: number,
): { state: ShowRunState; snapshot: TimelineSnapshot } => {
  let nextState = ensureCursorCue(timeline, state);

  if (nextState.playing && nextState.anchorStartedAtMs !== null) {
    const elapsedSinceStart = Math.max(0, nowMs - nextState.anchorStartedAtMs);
    nextState = {
      ...nextState,
      cursor: {
        ...nextState.cursor,
        elapsedMs: elapsedSinceStart,
      },
    };

    let guard = 0;
    while (nextState.cursor.cueId && guard < 256) {
      guard += 1;
      const cue = timeline.cues[nextState.cursor.cueId];
      if (!cue) {
        nextState = {
          ...nextState,
          cursor: { ...nextState.cursor, cueId: null, chaseId: null, chaseIndex: -1, elapsedMs: 0 },
          playing: false,
          anchorStartedAtMs: null,
          pausedAtMs: nowMs,
        };
        break;
      }

      const duration = cueDuration(cue);
      if (nextState.cursor.elapsedMs < duration || duration === 0) {
        break;
      }

      const remainder = nextState.cursor.elapsedMs - duration;
      const resolved = resolveFollow(timeline, nextState);
      const shouldBlackout = cue.transition.follow === 'blackout';
      if (!resolved.cueId) {
        nextState = {
          ...nextState,
          cursor: { cueId: null, chaseId: null, chaseIndex: -1, elapsedMs: 0 },
          playing: false,
          anchorStartedAtMs: null,
          pausedAtMs: nowMs,
          blackout: shouldBlackout ? true : nextState.blackout,
        };
        break;
      }

      nextState = {
        ...nextState,
        cursor: {
          cueId: resolved.cueId,
          chaseId: resolved.chaseId,
          chaseIndex: resolved.chaseIndex,
          elapsedMs: remainder,
        },
        historyCueIds: [...nextState.historyCueIds, resolved.cueId],
        anchorStartedAtMs: nowMs - remainder,
      };
    }
  }

  const cue = nextState.cursor.cueId ? timeline.cues[nextState.cursor.cueId] : undefined;
  const currentScene = cue ? timeline.scenes[cue.sceneId] : undefined;
  const fromCueId = previousCueId(nextState.historyCueIds);
  const fromCue = fromCueId ? timeline.cues[fromCueId] : undefined;
  const fromScene = fromCue ? timeline.scenes[fromCue.sceneId] : undefined;

  const currentSceneMap = toSceneMap(currentScene);
  const fromSceneMap = toSceneMap(fromScene);

  let outputValues: Record<string, number> = {};

  if (cue) {
    const { fadeInMs, holdMs, fadeOutMs } = cue.transition;
    const elapsed = Math.max(0, nextState.cursor.elapsedMs);
    if (fadeInMs > 0 && elapsed < fadeInMs) {
      outputValues = blendScenes(fromSceneMap, currentSceneMap, elapsed / fadeInMs);
    } else if (elapsed < fadeInMs + holdMs || fadeOutMs <= 0) {
      outputValues = blendScenes(currentSceneMap, currentSceneMap, 1);
    } else {
      const fadeOutElapsed = Math.min(fadeOutMs, elapsed - (fadeInMs + holdMs));
      outputValues = blendScenes(currentSceneMap, new Map<string, number>(), fadeOutElapsed / fadeOutMs);
    }
  }

  if (nextState.blackout) {
    outputValues = blackoutFrame(outputValues);
  }

  return {
    state: nextState,
    snapshot: {
      activeCueId: nextState.cursor.cueId,
      values: outputValues,
      playing: nextState.playing,
      blackout: nextState.blackout,
    },
  };
};
