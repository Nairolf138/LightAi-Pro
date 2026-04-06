import { ShowState } from './types';

interface PersistedShowState {
  version: 1;
  state: ShowState;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const assertValidPayload = (value: unknown): asserts value is PersistedShowState => {
  if (!isRecord(value) || value.version !== 1 || !('state' in value)) {
    throw new Error('Invalid serialized show state payload');
  }

  if (!isRecord(value.state)) {
    throw new Error('Serialized payload state is invalid');
  }
};

export const serializeShowState = (state: ShowState): string =>
  JSON.stringify({
    version: 1,
    state,
  } satisfies PersistedShowState);

export const deserializeShowState = (json: string): ShowState => {
  const payload = JSON.parse(json) as unknown;
  assertValidPayload(payload);
  return payload.state;
};
