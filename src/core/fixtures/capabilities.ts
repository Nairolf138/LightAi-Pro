import type {
  FixtureChannelDefinition,
  FixtureChannelRange,
  FixtureModeLimitations,
  FixtureProfile,
  FixtureProfileMode,
} from './types';

export const CANONICAL_ATTRIBUTE_ALIASES = {
  dimmer: ['intensity', 'masterdimmer'],
  red: ['r'],
  green: ['g'],
  blue: ['b'],
  white: ['w'],
  amber: ['a'],
  uv: ['ultraviolet'],
  rgb: ['colormix', 'colormixing', 'rgbmix'],
  rgbw: ['colormixrgbw', 'rgbwcolor'],
  pan: ['pancoarse'],
  panFine: ['panfine', 'pan16', 'panmsb'],
  tilt: ['tiltcoarse'],
  tiltFine: ['tiltfine', 'tilt16', 'tiltmsb'],
  strobe: ['shutter', 'strobeeffect'],
} as const;

const recommendedAttributes = ['dimmer'] as const;

const aliasLookup = (() => {
  const entries = new Map<string, string>();

  Object.entries(CANONICAL_ATTRIBUTE_ALIASES).forEach(([canonical, aliases]) => {
    entries.set(normalizeAttributeToken(canonical), canonical);
    aliases.forEach((alias) => entries.set(normalizeAttributeToken(alias), canonical));
  });

  return entries;
})();

export interface FixtureAttributeCapability {
  id: string;
  label: string;
  channels: number[];
  resolutionBits: 8 | 16;
  range: FixtureChannelRange;
  sourceChannelKeys: string[];
}

export interface FixtureCapabilityCompatibility {
  missingRecommendedAttributes: string[];
  unavailableAttributes: string[];
  degradedResolutions: Array<{
    attribute: string;
    requested: 16;
    provided: 8;
  }>;
  modeLimitations: FixtureModeLimitations;
}

export interface FixtureCapabilities {
  profileId: string;
  modeId: string;
  attributes: Record<string, FixtureAttributeCapability>;
  macros: Array<{ id: string; name: string; channelKeys: string[] }>;
  compatibility: FixtureCapabilityCompatibility;
}

export interface CapabilityConstraint {
  type: 'type' | 'range' | 'modeDependency';
  message: string;
}

export interface CapabilityChannelEntry {
  channel: number;
  key: string;
  name: string;
  type: FixtureChannelDefinition['type'];
  attributeId: string;
  resolutionBits: 8 | 16;
  range: FixtureChannelRange;
  defaultValue: number;
}

export interface FixtureCapabilitySchema {
  profileId: string;
  modeId: string;
  capabilities: Record<string, FixtureAttributeCapability>;
  channelMap: Record<number, CapabilityChannelEntry>;
  constraints: CapabilityConstraint[];
}

export interface FixtureCapabilityValidationIssue {
  code: 'invalidChannelType' | 'invalidRange' | 'invalidDefaultValue' | 'invalidFineDependency';
  severity: 'error' | 'warning';
  message: string;
  modeId: string;
  profileId: string;
  channel?: number;
}

export interface FixtureCapabilityIndexes {
  byAttribute: Record<string, number[]>;
  byFamily: Record<string, number[]>;
  byDmxRange: Array<{ start: number; end: number; attributeId: string }>;
}

function normalizeAttributeToken(value: string): string {
  return value.replace(/[^a-z0-9]+/giu, '').toLowerCase();
}

export function normalizeFixtureAttributeName(value: string): string {
  const normalized = normalizeAttributeToken(value);
  return aliasLookup.get(normalized) ?? normalized;
}

const defaultRangeForChannel = (channel: FixtureChannelDefinition): FixtureChannelRange => {
  if (channel.range) {
    return channel.range;
  }

  if (channel.resolutionBits === 16) {
    return { min: 0, max: 65535 };
  }

  return { min: 0, max: 255 };
};

const resolveChannelCanonicalAttribute = (channel: FixtureChannelDefinition): string => {
  if (typeof channel.attribute === 'string' && channel.attribute.trim().length > 0) {
    return normalizeFixtureAttributeName(channel.attribute);
  }

  const candidates = [channel.key, channel.name, ...(channel.aliases ?? [])];
  for (const candidate of candidates) {
    const normalized = normalizeFixtureAttributeName(candidate);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return normalizeFixtureAttributeName(`${channel.type}.${channel.key}`);
};

export const getChannelAttributeId = (channel: FixtureChannelDefinition): string => {
  const canonical = resolveChannelCanonicalAttribute(channel);
  if (canonical === 'rgb' || canonical === 'rgbw') {
    return `color.${canonical}`;
  }

  return `${channel.type}.${canonical}`;
};

export const getFixtureCapabilities = (
  profile: FixtureProfile,
  mode: FixtureProfileMode,
): FixtureCapabilities => {
  const attributes = new Map<string, FixtureAttributeCapability>();

  mode.channels.forEach((channel, index) => {
    const attributeId = getChannelAttributeId(channel);
    const existing = attributes.get(attributeId);
    const resolutionBits = channel.resolutionBits ?? 8;
    const channelNumber = index + 1;

    if (!existing) {
      attributes.set(attributeId, {
        id: attributeId,
        label: channel.name,
        channels: [channelNumber],
        resolutionBits,
        range: defaultRangeForChannel(channel),
        sourceChannelKeys: [channel.key],
      });
      return;
    }

    existing.channels.push(channelNumber);
    existing.sourceChannelKeys.push(channel.key);
    existing.resolutionBits = existing.resolutionBits === 16 || resolutionBits === 16 ? 16 : 8;
    existing.range = {
      min: Math.min(existing.range.min, defaultRangeForChannel(channel).min),
      max: Math.max(existing.range.max, defaultRangeForChannel(channel).max),
    };
  });

  const availableCanonicalAttributes = [...attributes.values()].map((item) => item.id.split('.').at(1) ?? item.id);
  const unavailableAttributes = (mode.limitations?.unsupportedAttributes ?? []).map(normalizeFixtureAttributeName);

  const degradedResolutions = availableCanonicalAttributes
    .filter((attribute) => attribute.endsWith('Fine'))
    .filter((attribute) => !availableCanonicalAttributes.includes(attribute.replace(/Fine$/u, '')))
    .map((attribute) => ({
      attribute,
      requested: 16 as const,
      provided: 8 as const,
    }));

  return {
    profileId: profile.profileId,
    modeId: mode.id,
    attributes: Object.fromEntries(attributes.entries()),
    macros: (mode.macros ?? []).map((macro) => ({
      id: macro.id,
      name: macro.name,
      channelKeys: [...macro.channelKeys],
    })),
    compatibility: {
      missingRecommendedAttributes: recommendedAttributes
        .map((attribute) => `intensity.${attribute}`)
        .filter((attribute) => !attributes.has(attribute)),
      unavailableAttributes,
      degradedResolutions,
      modeLimitations: {
        unsupportedAttributes: mode.limitations?.unsupportedAttributes ?? [],
        notes: mode.limitations?.notes ?? [],
      },
    },
  };
};

const allowedChannelTypes = new Set<FixtureChannelDefinition['type']>([
  'intensity',
  'color',
  'position',
  'beam',
  'gobo',
  'effect',
  'strobe',
  'control',
  'custom',
]);

export const toCapabilitySchema = (profile: FixtureProfile, mode: FixtureProfileMode): FixtureCapabilitySchema => {
  const capabilities = getFixtureCapabilities(profile, mode);
  const channelMap: Record<number, CapabilityChannelEntry> = {};

  mode.channels.forEach((channel, index) => {
    const channelNumber = index + 1;
    channelMap[channelNumber] = {
      channel: channelNumber,
      key: channel.key,
      name: channel.name,
      type: channel.type,
      attributeId: getChannelAttributeId(channel),
      resolutionBits: channel.resolutionBits ?? 8,
      range: defaultRangeForChannel(channel),
      defaultValue: channel.defaultValue ?? 0,
    };
  });

  return {
    profileId: profile.profileId,
    modeId: mode.id,
    capabilities: capabilities.attributes,
    channelMap,
    constraints: [],
  };
};

export const validateCapabilitySchema = (schema: FixtureCapabilitySchema): FixtureCapabilityValidationIssue[] => {
  const issues: FixtureCapabilityValidationIssue[] = [];
  const channels = Object.values(schema.channelMap).sort((a, b) => a.channel - b.channel);
  const channelSet = new Set(channels.map((entry) => entry.channel));

  channels.forEach((entry) => {
    if (!allowedChannelTypes.has(entry.type)) {
      issues.push({
        code: 'invalidChannelType',
        severity: 'error',
        message: `Unsupported channel type "${entry.type}" for channel ${entry.channel}.`,
        modeId: schema.modeId,
        profileId: schema.profileId,
        channel: entry.channel,
      });
    }

    if (entry.range.min > entry.range.max) {
      issues.push({
        code: 'invalidRange',
        severity: 'error',
        message: `Invalid range on channel ${entry.channel}: min (${entry.range.min}) > max (${entry.range.max}).`,
        modeId: schema.modeId,
        profileId: schema.profileId,
        channel: entry.channel,
      });
    }

    if (entry.defaultValue < entry.range.min || entry.defaultValue > entry.range.max) {
      issues.push({
        code: 'invalidDefaultValue',
        severity: 'error',
        message: `Default value ${entry.defaultValue} is outside channel ${entry.channel} range [${entry.range.min}, ${entry.range.max}].`,
        modeId: schema.modeId,
        profileId: schema.profileId,
        channel: entry.channel,
      });
    }

    if (entry.attributeId.endsWith('Fine')) {
      const coarseAttribute = entry.attributeId.replace(/Fine$/u, '');
      const hasCoarse = channels.some((candidate) => candidate.attributeId === coarseAttribute);
      if (!hasCoarse) {
        issues.push({
          code: 'invalidFineDependency',
          severity: 'warning',
          message: `Fine channel ${entry.channel} (${entry.attributeId}) has no coarse dependency in mode ${schema.modeId}.`,
          modeId: schema.modeId,
          profileId: schema.profileId,
          channel: entry.channel,
        });
      }
    }
  });

  const sparseChannels = channels.filter((entry, index) => entry.channel !== index + 1 && !channelSet.has(index + 1));
  if (sparseChannels.length > 0) {
    issues.push({
      code: 'invalidRange',
      severity: 'warning',
      message: `Channel map has gaps for mode ${schema.modeId}; found non-contiguous numbering.`,
      modeId: schema.modeId,
      profileId: schema.profileId,
    });
  }

  return issues;
};

export const buildCapabilityIndexes = (schema: FixtureCapabilitySchema): FixtureCapabilityIndexes => {
  const byAttribute = new Map<string, number[]>();
  const byFamily = new Map<string, number[]>();
  const byDmxRange: Array<{ start: number; end: number; attributeId: string }> = [];

  Object.values(schema.channelMap).forEach((entry) => {
    byAttribute.set(entry.attributeId, [...(byAttribute.get(entry.attributeId) ?? []), entry.channel]);
    byFamily.set(entry.type, [...(byFamily.get(entry.type) ?? []), entry.channel]);
    byDmxRange.push({ start: entry.range.min, end: entry.range.max, attributeId: entry.attributeId });
  });

  byDmxRange.sort((left, right) => left.start - right.start || left.end - right.end);

  return {
    byAttribute: Object.fromEntries(byAttribute.entries()),
    byFamily: Object.fromEntries(byFamily.entries()),
    byDmxRange,
  };
};

export const mapRequestedAttributesToCapabilities = (
  capabilities: FixtureCapabilities,
  requestedAttributes: ReadonlyArray<string>,
): {
  supported: string[];
  unsupported: string[];
  degraded: Array<{ requested: string; fallback: string }>;
} => {
  const supported: string[] = [];
  const unsupported: string[] = [];
  const degraded: Array<{ requested: string; fallback: string }> = [];

  requestedAttributes.forEach((requestedAttribute) => {
    const normalized = normalizeFixtureAttributeName(requestedAttribute);
    const directMatch = Object.keys(capabilities.attributes).find((attributeId) => attributeId.endsWith(`.${normalized}`));

    if (directMatch) {
      supported.push(directMatch);
      return;
    }

    if (normalized.endsWith('fine')) {
      const coarse = normalized.replace(/fine$/u, '');
      const fallback = Object.keys(capabilities.attributes).find((attributeId) => attributeId.endsWith(`.${coarse}`));
      if (fallback) {
        degraded.push({ requested: requestedAttribute, fallback });
        return;
      }
    }

    unsupported.push(requestedAttribute);
  });

  return { supported, unsupported, degraded };
};
