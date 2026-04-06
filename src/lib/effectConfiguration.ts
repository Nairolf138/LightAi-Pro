import { effects } from './effects';

export const EFFECT_CONFIGURATION_SCHEMA_VERSION = 2;

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface EffectConfigurationEnvelope {
  version: number;
  effectName: string;
  configuration: Record<string, JsonValue>;
  source?: string;
  savedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
};

const cloneConfiguration = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeLegacyEnvelope = (payload: unknown): EffectConfigurationEnvelope => {
  if (!isRecord(payload)) {
    throw new Error('Configuration payload must be a JSON object.');
  }

  if ('version' in payload) {
    const version = payload.version;

    if (version === 2) {
      const effectName = payload.effectName;
      const configuration = payload.configuration;

      if (typeof effectName !== 'string' || !effectName.trim()) {
        throw new Error('Configuration v2 requires a valid effectName.');
      }

      if (!isRecord(configuration) || !isJsonValue(configuration)) {
        throw new Error('Configuration v2 has an invalid configuration object.');
      }

      return {
        version: 2,
        effectName,
        configuration: cloneConfiguration(configuration) as Record<string, JsonValue>,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        savedAt: typeof payload.savedAt === 'string' ? payload.savedAt : undefined
      };
    }

    if (version === 1) {
      const effectName = payload.effectName;
      const configuration = payload.configuration;

      if (typeof effectName !== 'string' || !effectName.trim()) {
        throw new Error('Configuration v1 requires a valid effectName.');
      }

      if (!isRecord(configuration) || !isJsonValue(configuration)) {
        throw new Error('Configuration v1 has an invalid configuration object.');
      }

      return {
        version: 2,
        effectName,
        configuration: cloneConfiguration(configuration) as Record<string, JsonValue>,
        source: 'migrated-v1',
        savedAt: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported configuration schema version: ${String(version)}`);
  }

  if (isJsonValue(payload)) {
    return {
      version: 2,
      effectName: effects[0]?.name ?? 'Color Chase',
      configuration: cloneConfiguration(payload) as Record<string, JsonValue>,
      source: 'migrated-v0',
      savedAt: new Date().toISOString()
    };
  }

  throw new Error('Legacy configuration payload is invalid.');
};

export const prepareConfigurationForStorage = (
  effectName: string,
  configuration: Record<string, unknown>,
  source: 'preset' | 'history'
): EffectConfigurationEnvelope => ({
  version: EFFECT_CONFIGURATION_SCHEMA_VERSION,
  effectName,
  configuration: cloneConfiguration(configuration) as Record<string, JsonValue>,
  source,
  savedAt: new Date().toISOString()
});

export const migrateAndValidateConfiguration = (
  payload: unknown,
  fallbackEffectName: string
): EffectConfigurationEnvelope => {
  const normalized = normalizeLegacyEnvelope(payload);
  const matchedEffect = effects.find((effect) => effect.name === normalized.effectName);

  if (!matchedEffect) {
    return {
      ...normalized,
      effectName: fallbackEffectName
    };
  }

  const expectedKeys = Object.keys(matchedEffect.configuration).sort();
  const payloadKeys = Object.keys(normalized.configuration).sort();

  if (expectedKeys.length !== payloadKeys.length) {
    throw new Error('Configuration keys mismatch with effect schema.');
  }

  for (const key of expectedKeys) {
    if (!(key in normalized.configuration)) {
      throw new Error(`Missing required key: ${key}`);
    }

    const expectedValue = matchedEffect.configuration[key];
    const nextValue = normalized.configuration[key];

    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(nextValue)) {
        throw new Error(`Invalid type for key: ${key}`);
      }
      continue;
    }

    if (typeof expectedValue !== typeof nextValue) {
      throw new Error(`Invalid type for key: ${key}`);
    }
  }

  return normalized;
};

export const applyConfigurationToEngine = (
  effectName: string,
  configuration: Record<string, JsonValue>
): { effectIndex: number; previousConfiguration: Record<string, unknown> } => {
  const effectIndex = effects.findIndex((effect) => effect.name === effectName);

  if (effectIndex < 0) {
    throw new Error(`Unknown effect: ${effectName}`);
  }

  const previousConfiguration = cloneConfiguration(effects[effectIndex].configuration);
  effects[effectIndex].configuration = cloneConfiguration(configuration);

  return {
    effectIndex,
    previousConfiguration
  };
};

export const rollbackConfiguration = (
  effectIndex: number,
  previousConfiguration: Record<string, unknown>
) => {
  effects[effectIndex].configuration = cloneConfiguration(previousConfiguration);
};
