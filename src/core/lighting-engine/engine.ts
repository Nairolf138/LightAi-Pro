import { applyScene, setChannel, startCue, stopCue, tickCue } from './state';
import { ShowState } from './types';

export type LightingCommand =
  | { type: 'setChannel'; universeId: string; channel: number; value: number }
  | { type: 'applyScene'; sceneId: string }
  | { type: 'startCue'; cueId: string; nowMs: number }
  | { type: 'stopCue' }
  | { type: 'tick'; nowMs: number };

export const reduceLightingCommand = (
  state: ShowState,
  command: LightingCommand,
): ShowState => {
  switch (command.type) {
    case 'setChannel':
      return setChannel(state, command.universeId, command.channel, command.value);
    case 'applyScene':
      return applyScene(state, command.sceneId);
    case 'startCue':
      return startCue(state, command.cueId, command.nowMs);
    case 'stopCue':
      return stopCue(state);
    case 'tick':
      return tickCue(state, command.nowMs);
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
};
