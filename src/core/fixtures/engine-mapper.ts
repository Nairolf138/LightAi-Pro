import type { ShowState, Universe } from '../lighting-engine/types';
import type { PatchRenderMapping } from './types';

const frameToUniverse = (universeId: string, frame: ReadonlyArray<number>): Universe => {
  const channels: Record<number, number> = {};
  frame.forEach((value, index) => {
    const channel = index + 1;
    if (value !== 0) {
      channels[channel] = value;
    }
  });

  return {
    id: universeId,
    name: `Universe ${universeId}`,
    size: frame.length,
    channels,
  };
};

export const patchRenderMappingToShowStateUniverses = (
  mapping: PatchRenderMapping,
): ShowState['universes'] => {
  const universes: ShowState['universes'] = {};

  for (const [universeIndexAsString, frame] of Object.entries(mapping.universeFrames)) {
    universes[universeIndexAsString] = frameToUniverse(universeIndexAsString, frame);
  }

  return universes;
};
