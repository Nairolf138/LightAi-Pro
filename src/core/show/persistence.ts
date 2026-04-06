import { defaultShowOutputConfig } from '../protocols/types';
import type { ShowTimeline, UserProject } from './types';

interface PersistedTimelinePayload {
  version: 1;
  timeline: ShowTimeline;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const createEmptyTimeline = (): ShowTimeline => ({
  version: 1,
  scenes: {},
  cues: {},
  chases: {},
  entryCueId: null,
  output: defaultShowOutputConfig,
});

export const serializeTimeline = (timeline: ShowTimeline): string =>
  JSON.stringify({
    version: 1,
    timeline,
  } satisfies PersistedTimelinePayload);

export const deserializeTimeline = (json: string): ShowTimeline => {
  const parsed = JSON.parse(json) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !('timeline' in parsed)) {
    throw new Error('Invalid show timeline payload');
  }

  const timeline = parsed.timeline as ShowTimeline;

  return {
    ...timeline,
    output: timeline.output ?? defaultShowOutputConfig,
    version: 1,
  };
};

export const attachTimelineToProject = (
  project: UserProject,
  timeline: ShowTimeline,
): UserProject => ({
  ...project,
  showTimeline: timeline,
});

export const readTimelineFromProject = (project: UserProject): ShowTimeline =>
  project.showTimeline ?? createEmptyTimeline();
