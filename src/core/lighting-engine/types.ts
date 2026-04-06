export type ChannelValue = number;

export interface Fixture {
  id: string;
  name: string;
  universeId: string;
  address: number;
  channels: number;
}

export interface Universe {
  id: string;
  name: string;
  size: number;
  channels: Record<number, ChannelValue>;
}

export interface SceneValue {
  universeId: string;
  channel: number;
  value: ChannelValue;
}

export interface Scene {
  id: string;
  name: string;
  values: SceneValue[];
}

export interface CueStep {
  sceneId: string;
  holdMs: number;
  fadeMs: number;
}

export interface Cue {
  id: string;
  name: string;
  steps: CueStep[];
  loop: boolean;
}

export interface ActiveCueState {
  cueId: string;
  stepIndex: number;
  startedAtMs: number;
  stepStartedAtMs: number;
}

export interface ShowState {
  fixtures: Record<string, Fixture>;
  universes: Record<string, Universe>;
  scenes: Record<string, Scene>;
  cues: Record<string, Cue>;
  activeCue: ActiveCueState | null;
  currentSceneId: string | null;
  tick: number;
}

export const DEFAULT_UNIVERSE_SIZE = 512;
