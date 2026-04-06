import type { ShowOutputConfig } from '../protocols/types';

export type ChannelLevel = number;

export interface SceneValue {
  universeId: string;
  channel: number;
  value: ChannelLevel;
}

export interface Scene {
  id: string;
  name: string;
  values: SceneValue[];
}

export type CueFollowMode = 'next' | 'hold' | 'stop' | 'cue' | 'chase' | 'blackout';

export interface Transition {
  fadeInMs: number;
  holdMs: number;
  fadeOutMs: number;
  follow: CueFollowMode;
  followCueId?: string;
  followChaseId?: string;
}

export interface Cue {
  id: string;
  name: string;
  sceneId: string;
  transition: Transition;
}

export interface Chase {
  id: string;
  name: string;
  cueIds: string[];
  loop: boolean;
}

export interface ShowTimeline {
  version: 1;
  scenes: Record<string, Scene>;
  cues: Record<string, Cue>;
  chases: Record<string, Chase>;
  entryCueId: string | null;
  output: ShowOutputConfig;
}

export interface TimelineCursor {
  cueId: string | null;
  chaseId: string | null;
  chaseIndex: number;
  elapsedMs: number;
}

export interface ShowRunState {
  cursor: TimelineCursor;
  playing: boolean;
  pausedAtMs: number | null;
  anchorStartedAtMs: number | null;
  historyCueIds: string[];
  blackout: boolean;
}

export interface TimelineSnapshot {
  activeCueId: string | null;
  values: Record<string, ChannelLevel>;
  playing: boolean;
  blackout: boolean;
}

export interface UserProject {
  id: string;
  name?: string;
  showTimeline?: ShowTimeline;
  [key: string]: unknown;
}
