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
