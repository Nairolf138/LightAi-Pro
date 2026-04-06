import { createInitialShowRunState, evaluateTimeline } from './executor';
import type { ShowRunState, ShowTimeline, TimelineSnapshot } from './types';

export class ShowController {
  private state: ShowRunState = createInitialShowRunState();

  constructor(private readonly timeline: ShowTimeline) {}

  getState(): ShowRunState {
    return this.state;
  }

  go(nowMs: number): TimelineSnapshot {
    const cueId = this.state.cursor.cueId ?? this.timeline.entryCueId;
    const elapsedMs = this.state.pausedAtMs !== null ? this.state.cursor.elapsedMs : 0;

    this.state = {
      ...this.state,
      cursor: {
        ...this.state.cursor,
        cueId,
        elapsedMs,
      },
      playing: true,
      pausedAtMs: null,
      anchorStartedAtMs: nowMs - elapsedMs,
      blackout: false,
      historyCueIds:
        cueId && this.state.historyCueIds[this.state.historyCueIds.length - 1] !== cueId
          ? [...this.state.historyCueIds, cueId]
          : this.state.historyCueIds,
    };

    return this.tick(nowMs);
  }

  pause(nowMs: number): TimelineSnapshot {
    const evaluated = evaluateTimeline(this.timeline, this.state, nowMs);
    this.state = {
      ...evaluated.state,
      playing: false,
      pausedAtMs: nowMs,
      anchorStartedAtMs: null,
    };

    return evaluated.snapshot;
  }

  back(nowMs: number): TimelineSnapshot {
    const history = this.state.historyCueIds;
    const previous = history.length > 1 ? history[history.length - 2] : this.timeline.entryCueId;

    this.state = {
      ...this.state,
      cursor: {
        cueId: previous ?? null,
        chaseId: null,
        chaseIndex: -1,
        elapsedMs: 0,
      },
      historyCueIds: previous ? [...history.slice(0, -1)] : [],
      blackout: false,
      anchorStartedAtMs: this.state.playing ? nowMs : null,
      pausedAtMs: this.state.playing ? null : nowMs,
    };

    return this.tick(nowMs);
  }

  jumpCue(cueId: string, nowMs: number): TimelineSnapshot {
    if (!this.timeline.cues[cueId]) {
      throw new Error(`Cue "${cueId}" does not exist in the timeline`);
    }

    this.state = {
      ...this.state,
      cursor: {
        cueId,
        chaseId: null,
        chaseIndex: -1,
        elapsedMs: 0,
      },
      blackout: false,
      historyCueIds: [...this.state.historyCueIds, cueId],
      anchorStartedAtMs: this.state.playing ? nowMs : null,
      pausedAtMs: this.state.playing ? null : nowMs,
    };

    return this.tick(nowMs);
  }

  blackout(nowMs: number): TimelineSnapshot {
    this.state = {
      ...this.state,
      blackout: true,
    };

    return this.tick(nowMs);
  }

  tick(nowMs: number): TimelineSnapshot {
    const evaluated = evaluateTimeline(this.timeline, this.state, nowMs);
    this.state = evaluated.state;
    return evaluated.snapshot;
  }
}
