import { observability } from './observability';
import { syncSharedShowState, type SharedStateSyncResult } from './liveCollaboration';

export type CollaborationEntityType = 'cue' | 'patch' | 'preset';

export type ConflictFieldChoice = 'local' | 'remote';

export interface CollaborationConflict<TState extends Record<string, unknown>> {
  entityType: CollaborationEntityType;
  sharedShowId: string;
  expectedVersion: number;
  localPatch: Partial<TState>;
  remoteState: TState;
  remoteVersion: number;
  conflictingFields: string[];
  detectedAt: string;
}

export interface GuidedMergeResolution<TState extends Record<string, unknown>> {
  fieldChoices: Record<string, ConflictFieldChoice>;
  fallbackToManual?: boolean;
  manualPatch?: Partial<TState>;
}

export const mapCriticalCollaborationFlows = (): Array<{
  entityType: CollaborationEntityType;
  writePath: string;
  conflictPoints: string[];
}> => [
  {
    entityType: 'cue',
    writePath: 'sync_shared_show_state -> show_payload.timeline.cues',
    conflictPoints: ['transition timings', 'follow mode', 'scene references', 'simultaneous launch order'],
  },
  {
    entityType: 'patch',
    writePath: 'sync_shared_show_state -> show_payload.patch',
    conflictPoints: ['DMX universe/address collisions', 'fixture mode changes', 'attribute remapping'],
  },
  {
    entityType: 'preset',
    writePath: 'presets table + shared_show_state references',
    conflictPoints: ['same preset name edited concurrently', 'parameter override on same effect', 'stale base version'],
  },
];

const extractConflictingFields = <TState extends Record<string, unknown>>(
  localPatch: Partial<TState>,
  remoteState: TState
): string[] => {
  return Object.keys(localPatch).filter((key) => {
    const localValue = localPatch[key as keyof TState];
    const remoteValue = remoteState[key as keyof TState];
    return JSON.stringify(localValue) !== JSON.stringify(remoteValue);
  });
};

export const buildGuidedMergePatch = <TState extends Record<string, unknown>>(
  conflict: CollaborationConflict<TState>,
  resolution: GuidedMergeResolution<TState>
): Partial<TState> => {
  if (resolution.fallbackToManual) {
    return resolution.manualPatch ?? {};
  }

  const mergedPatch: Partial<TState> = {};

  for (const field of conflict.conflictingFields) {
    const choice = resolution.fieldChoices[field] ?? 'local';
    if (choice === 'local') {
      mergedPatch[field as keyof TState] = conflict.localPatch[field as keyof TState] as TState[keyof TState];
      continue;
    }
    mergedPatch[field as keyof TState] = conflict.remoteState[field as keyof TState];
  }

  return mergedPatch;
};

export async function syncWithGuidedMerge<TState extends Record<string, unknown>>(params: {
  entityType: CollaborationEntityType;
  sharedShowId: string;
  expectedVersion: number;
  patch: Partial<TState>;
  fetchLatestState: (sharedShowId: string) => Promise<SharedStateSyncResult<TState>>;
  resolveConflict?: (conflict: CollaborationConflict<TState>) => Promise<GuidedMergeResolution<TState>>;
}): Promise<SharedStateSyncResult<TState>> {
  try {
    return await syncSharedShowState<TState>(params.sharedShowId, params.expectedVersion, params.patch);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isConflict = message.includes('version conflict');
    if (!isConflict) {
      throw error;
    }

    const latest = await params.fetchLatestState(params.sharedShowId);
    const conflict: CollaborationConflict<TState> = {
      entityType: params.entityType,
      sharedShowId: params.sharedShowId,
      expectedVersion: params.expectedVersion,
      localPatch: params.patch,
      remoteState: latest.state,
      remoteVersion: latest.stateVersion,
      conflictingFields: extractConflictingFields(params.patch, latest.state),
      detectedAt: new Date().toISOString(),
    };

    observability.warn('collaboration', 'Conflict detected; entering guided merge', conflict, ['collaboration', 'conflict']);

    if (!params.resolveConflict) {
      throw new Error('manual_conflict_resolution_required');
    }

    const resolution = await params.resolveConflict(conflict);
    const mergedPatch = buildGuidedMergePatch(conflict, resolution);
    return syncSharedShowState<TState>(params.sharedShowId, latest.stateVersion, mergedPatch);
  }
}
