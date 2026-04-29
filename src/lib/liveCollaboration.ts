import { supabase } from './supabase';
import { observability } from './observability';

export type ProjectRole = 'owner' | 'operator' | 'viewer';

export interface SharedStateSyncResult<TState extends Record<string, unknown>> {
  id: string;
  stateVersion: number;
  state: TState;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LiveControlLock {
  projectId: string;
  holderUserId: string;
  holderSessionId: string;
  acquiredAt: string;
  heartbeatAt: string;
  expiresAt: string;
}

const mapSharedShowState = <TState extends Record<string, unknown>>(
  row: Record<string, unknown>
): SharedStateSyncResult<TState> => ({
  id: String(row.id),
  stateVersion: Number(row.state_version),
  state: (row.show_payload ?? {}) as TState,
  updatedAt: String(row.updated_at),
  updatedBy: row.updated_by ? String(row.updated_by) : null
});

const mapLock = (row: Record<string, unknown>): LiveControlLock => ({
  projectId: String(row.project_id),
  holderUserId: String(row.holder_user_id),
  holderSessionId: String(row.holder_session_id),
  acquiredAt: String(row.acquired_at),
  heartbeatAt: String(row.heartbeat_at),
  expiresAt: String(row.expires_at)
});

/**
 * Non-destructive optimistic synchronization for shared show state.
 * `patch` is merged server-side and persisted only if expectedVersion matches.
 */
export async function syncSharedShowState<TState extends Record<string, unknown>>(
  sharedShowId: string,
  expectedVersion: number,
  patch: Partial<TState>
): Promise<SharedStateSyncResult<TState>> {
  if (!navigator.onLine) {
    observability.warn('liveCollaboration', 'Skipped sync while offline; local patch must be replayed on reconnect', {
      sharedShowId,
      expectedVersion,
    }, ['offline', 'sync']);
    throw new Error('offline_sync_deferred');
  }

  const { data, error } = await supabase.rpc('sync_shared_show_state', {
    p_shared_show_id: sharedShowId,
    p_expected_version: expectedVersion,
    p_patch: patch
  });

  if (error || !data) {
    const isConflict = (error?.message ?? '').toLowerCase().includes('version conflict');
    observability.error('liveCollaboration', 'Shared show sync failed', {
      sharedShowId,
      expectedVersion,
      patch,
      error: error?.message,
      reason: isConflict ? 'edit_conflict' : 'rpc_error',
    }, isConflict ? 'sev2' : 'sev3', ['sync', isConflict ? 'conflict' : 'failure']);
    throw new Error(error?.message ?? 'Failed to synchronize shared show state');
  }

  return mapSharedShowState<TState>(data as Record<string, unknown>);
}

/**
 * Journal entry for cues or transport actions.
 */
export async function logCueAction(params: {
  projectId: string;
  sharedShowId: string | null;
  cueId: string;
  actionType?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.rpc('log_cue_action', {
    p_project_id: params.projectId,
    p_shared_show_id: params.sharedShowId,
    p_cue_id: params.cueId,
    p_action_type: params.actionType ?? 'cue_launch',
    p_payload: params.payload ?? {}
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Lock acquisition for live control conflict prevention.
 */
export async function acquireLiveControlLock(params: {
  projectId: string;
  sessionId: string;
  ttlSeconds?: number;
}): Promise<LiveControlLock> {
  const { data, error } = await supabase.rpc('acquire_live_control_lock', {
    p_project_id: params.projectId,
    p_session_id: params.sessionId,
    p_ttl_seconds: params.ttlSeconds ?? 15
  });

  if (error || !data) {
    observability.error('liveCollaboration', 'Unable to acquire live control lock', {
      projectId: params.projectId,
      sessionId: params.sessionId,
      ttlSeconds: params.ttlSeconds,
      error: error?.message,
    }, 'sev2', ['lock', 'conflict']);
    throw new Error(error?.message ?? 'Unable to acquire live control lock');
  }

  return mapLock(data as Record<string, unknown>);
}

export async function heartbeatLiveControlLock(params: {
  projectId: string;
  sessionId: string;
  ttlSeconds?: number;
}): Promise<LiveControlLock> {
  if (!navigator.onLine) {
    observability.warn('liveCollaboration', 'Heartbeat skipped while offline', {
      projectId: params.projectId,
      sessionId: params.sessionId,
    }, ['offline', 'lock']);
    throw new Error('offline_heartbeat_skipped');
  }
  const { data, error } = await supabase.rpc('heartbeat_live_control_lock', {
    p_project_id: params.projectId,
    p_session_id: params.sessionId,
    p_ttl_seconds: params.ttlSeconds ?? 15
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to heartbeat live control lock');
  }

  return mapLock(data as Record<string, unknown>);
}

export async function releaseLiveControlLock(projectId: string, sessionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('release_live_control_lock', {
    p_project_id: projectId,
    p_session_id: sessionId
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
