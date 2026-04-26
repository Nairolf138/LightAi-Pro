import type { CanonicalAttributeValue, CanonicalCue, CanonicalCuePart, CanonicalPalette, CanonicalShowModel } from './canonical';

export type SupportedConsole = 'grandma3' | 'chamsys' | 'avolites';
export type MarketRegion = 'eu' | 'uk' | 'us' | 'global';

export interface ConversionJournalEntry {
  level: 'info' | 'warning';
  scope: 'attribute' | 'palette' | 'cue' | 'timing' | 'naming' | 'export';
  sourceId: string;
  message: string;
  fallbackApplied?: string;
}

export interface ConsoleExportArtifact {
  format: 'json';
  filename: string;
  payload: string;
}

export interface ConsoleConversionResult {
  targetConsole: SupportedConsole;
  prioritizedConsoles: SupportedConsole[];
  exportArtifact: ConsoleExportArtifact;
  journal: ConversionJournalEntry[];
  summary: {
    convertedPalettes: number;
    convertedCues: number;
    warnings: number;
  };
}

interface ConsoleProfile {
  timingStepMs: number;
  naming: {
    groupPrefix: string;
    palettePrefix: string;
    cuePrefix: string;
  };
  unsupportedPaletteKinds: CanonicalPalette['kind'][];
  attributeFallbacks: Record<string, string | null>;
}

const CONSOLE_PROFILES: Record<SupportedConsole, ConsoleProfile> = {
  grandma3: {
    timingStepMs: 1,
    naming: { groupPrefix: 'Grp', palettePrefix: 'Preset', cuePrefix: 'Cue' },
    unsupportedPaletteKinds: [],
    attributeFallbacks: {
      focusZoom: 'beamZoom',
    },
  },
  chamsys: {
    timingStepMs: 100,
    naming: { groupPrefix: 'Group', palettePrefix: 'Palette', cuePrefix: 'Cue' },
    unsupportedPaletteKinds: ['focus'],
    attributeFallbacks: {
      focus: 'beam',
      focusZoom: 'beamZoom',
    },
  },
  avolites: {
    timingStepMs: 50,
    naming: { groupPrefix: 'Grp', palettePrefix: 'Pal', cuePrefix: 'Cue' },
    unsupportedPaletteKinds: ['focus'],
    attributeFallbacks: {
      focus: null,
      focusZoom: null,
    },
  },
};

export const getPrioritizedConsolesForV1 = (region: MarketRegion): SupportedConsole[] => {
  switch (region) {
    case 'eu':
      return ['grandma3', 'chamsys'];
    case 'uk':
      return ['chamsys', 'avolites'];
    case 'us':
      return ['grandma3', 'avolites'];
    default:
      return ['grandma3', 'chamsys'];
  }
};

const withNamingPrefix = (prefix: string, value: string): string => {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
};

const quantizeTiming = (value: number | undefined, stepMs: number): number | undefined => {
  if (typeof value !== 'number') {
    return undefined;
  }
  if (stepMs <= 1) {
    return Math.max(0, Math.round(value));
  }
  return Math.max(0, Math.round(value / stepMs) * stepMs);
};

const convertAttributes = (
  values: CanonicalAttributeValue[],
  profile: ConsoleProfile,
  sourceId: string,
  journal: ConversionJournalEntry[],
): CanonicalAttributeValue[] => {
  const converted: CanonicalAttributeValue[] = [];

  for (const attribute of values) {
    const mapped = profile.attributeFallbacks[attribute.attributeId];
    if (mapped === null) {
      journal.push({
        level: 'warning',
        scope: 'attribute',
        sourceId,
        message: `Attribut ${attribute.attributeId} non supporté sur la console cible.`,
        fallbackApplied: 'Valeur ignorée (dégradation contrôlée)',
      });
      continue;
    }

    if (typeof mapped === 'string' && mapped !== attribute.attributeId) {
      journal.push({
        level: 'warning',
        scope: 'attribute',
        sourceId,
        message: `Attribut ${attribute.attributeId} converti vers ${mapped}.`,
        fallbackApplied: `Remap attribut vers ${mapped}`,
      });
      converted.push({ ...attribute, attributeId: mapped });
      continue;
    }

    converted.push(attribute);
  }

  return converted;
};

const convertCuePart = (
  part: CanonicalCuePart,
  profile: ConsoleProfile,
  journal: ConversionJournalEntry[],
): CanonicalCuePart => ({
  ...part,
  targets: part.targets.map((target, index) => ({
    ...target,
    values: convertAttributes(target.values, profile, `${part.id}:target-${index + 1}`, journal),
  })),
});

const convertCue = (cue: CanonicalCue, profile: ConsoleProfile, journal: ConversionJournalEntry[]): CanonicalCue => {
  const quantized = {
    inMs: quantizeTiming(cue.timing.inMs, profile.timingStepMs) ?? 0,
    outMs: quantizeTiming(cue.timing.outMs, profile.timingStepMs),
    delayMs: quantizeTiming(cue.timing.delayMs, profile.timingStepMs),
    followMs: quantizeTiming(cue.timing.followMs, profile.timingStepMs),
  };

  if (
    quantized.inMs !== cue.timing.inMs ||
    quantized.outMs !== cue.timing.outMs ||
    quantized.delayMs !== cue.timing.delayMs ||
    quantized.followMs !== cue.timing.followMs
  ) {
    journal.push({
      level: 'warning',
      scope: 'timing',
      sourceId: cue.id,
      message: 'Timing quantifié selon la granularité console.',
      fallbackApplied: `Arrondi au pas ${profile.timingStepMs} ms`,
    });
  }

  return {
    ...cue,
    name: withNamingPrefix(profile.naming.cuePrefix, cue.name),
    timing: quantized,
    parts: cue.parts.map((part) => convertCuePart(part, profile, journal)),
  };
};

const convertPalette = (
  palette: CanonicalPalette,
  profile: ConsoleProfile,
  journal: ConversionJournalEntry[],
): CanonicalPalette | null => {
  if (profile.unsupportedPaletteKinds.includes(palette.kind)) {
    journal.push({
      level: 'warning',
      scope: 'palette',
      sourceId: palette.id,
      message: `Palette ${palette.kind} non supportée sur la console cible.`,
      fallbackApplied: 'Palette omise, les cues conservent les valeurs directes',
    });
    return null;
  }

  return {
    ...palette,
    name: withNamingPrefix(profile.naming.palettePrefix, palette.name),
    values: palette.values.map((entry, index) => ({
      ...entry,
      attributes: convertAttributes(entry.attributes, profile, `${palette.id}:value-${index + 1}`, journal),
    })),
  };
};

export const convertShowToConsole = (
  show: CanonicalShowModel,
  options: { region?: MarketRegion; targetConsole?: SupportedConsole } = {},
): ConsoleConversionResult => {
  const prioritizedConsoles = getPrioritizedConsolesForV1(options.region ?? 'global');
  const targetConsole = options.targetConsole ?? prioritizedConsoles[0];
  const profile = CONSOLE_PROFILES[targetConsole];
  const journal: ConversionJournalEntry[] = [];

  const convertedGroups = show.groups.map((group) => ({
    ...group,
    name: withNamingPrefix(profile.naming.groupPrefix, group.name),
  }));

  const convertedPalettes = show.palettes
    .map((palette) => convertPalette(palette, profile, journal))
    .filter((palette): palette is CanonicalPalette => Boolean(palette));

  const convertedCues = show.cues.map((cue) => convertCue(cue, profile, journal));

  journal.push({
    level: 'info',
    scope: 'export',
    sourceId: show.metadata.showId,
    message: `Export ${targetConsole} généré avec ${convertedCues.length} cues et ${convertedPalettes.length} palettes.`,
  });

  const exportPayload: CanonicalShowModel = {
    ...show,
    groups: convertedGroups,
    palettes: convertedPalettes,
    cues: convertedCues,
  };

  return {
    targetConsole,
    prioritizedConsoles,
    exportArtifact: {
      format: 'json',
      filename: `${show.metadata.showId}-${targetConsole}-import.json`,
      payload: JSON.stringify(exportPayload, null, 2),
    },
    journal,
    summary: {
      convertedPalettes: convertedPalettes.length,
      convertedCues: convertedCues.length,
      warnings: journal.filter((entry) => entry.level === 'warning').length,
    },
  };
};
