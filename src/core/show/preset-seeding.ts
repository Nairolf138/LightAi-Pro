import { getFixtureCapabilities } from '../fixtures/capabilities';
import { FixtureProfileRegistry } from '../fixtures/registry';
import type {
  CanonicalAttributeValue,
  CanonicalFixture,
  CanonicalGroup,
  CanonicalPalette,
  CanonicalShowModel,
} from './canonical';

type GroupAxis = 'position' | 'fixtureType' | 'scenicRole' | 'zone';

export interface InitialGroupingRule {
  axis: GroupAxis;
  enabled: boolean;
}

export interface GroupProposal extends CanonicalGroup {
  axis: GroupAxis;
  source: string;
}

export interface PaletteProposal extends CanonicalPalette {
  coverage: 'global' | 'partial';
  source: string;
}

export interface SeededPaletteSet {
  groups: GroupProposal[];
  palettes: PaletteProposal[];
}

export interface NamingSuggestion {
  readableName: string;
  artisticVariants: string[];
  cleanedName: string;
}

export interface NamingAssistant {
  suggestName: (input: {
    kind: 'group' | 'palette';
    baseName: string;
    fixtureIds: string[];
    category: string;
  }) => Promise<NamingSuggestion>;
}

export interface ValidatableSeedDraft {
  groups: Array<GroupProposal & { status: 'pending' | 'approved' | 'rejected' }>;
  palettes: Array<PaletteProposal & { status: 'pending' | 'approved' | 'rejected' }>;
}

const defaultRules: InitialGroupingRule[] = [
  { axis: 'position', enabled: true },
  { axis: 'fixtureType', enabled: true },
  { axis: 'scenicRole', enabled: true },
  { axis: 'zone', enabled: true },
];

const titleCase = (value: string): string =>
  value
    .replace(/[_-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toUpperCase()}${token.slice(1).toLowerCase()}`)
    .join(' ');

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/(^-|-$)/gu, '');

const extractTagValue = (fixture: CanonicalFixture, prefix: string): string | undefined => {
  const tag = fixture.tags?.find((entry) => entry.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
  return tag?.split(':').slice(1).join(':').trim();
};

const inferPositionFromName = (fixture: CanonicalFixture): string => {
  const normalized = `${fixture.name} ${(fixture.tags ?? []).join(' ')}`.toLowerCase();
  if (/\bfront\b/u.test(normalized)) return 'Front';
  if (/\bback\b|\bupstage\b/u.test(normalized)) return 'Back';
  if (/\bleft\b|\bstage-left\b/u.test(normalized)) return 'Left';
  if (/\bright\b|\bstage-right\b/u.test(normalized)) return 'Right';
  return `Universe ${fixture.universe}`;
};

const inferScenicRole = (fixture: CanonicalFixture): string => {
  const explicit = extractTagValue(fixture, 'role');
  if (explicit) return titleCase(explicit);

  const normalized = fixture.name.toLowerCase();
  if (normalized.includes('wash')) return 'Wash';
  if (normalized.includes('spot')) return 'Spot';
  if (normalized.includes('beam')) return 'Beam';
  if (normalized.includes('blinder')) return 'Blinder';
  return 'Generic';
};

const inferZone = (fixture: CanonicalFixture): string => {
  const explicit = extractTagValue(fixture, 'zone');
  if (explicit) return titleCase(explicit);
  return `U${fixture.universe}`;
};

const createAttributeValue = (attributeId: string, value: number | string, scale: CanonicalAttributeValue['scale']): CanonicalAttributeValue => ({
  attributeId,
  value,
  scale,
});

const inferPaletteValues = (
  fixture: CanonicalFixture,
  registry: FixtureProfileRegistry,
): Array<{ kind: CanonicalPalette['kind']; values: CanonicalAttributeValue[] }> => {
  const profile = registry.getProfile(fixture.fixtureType);
  if (!profile) {
    return [];
  }

  const modeHint = fixture.modeId.includes(':') ? fixture.modeId.split(':').at(-1) : fixture.modeId;
  const mode = profile.modes.find((entry) => entry.id === fixture.modeId || entry.id === modeHint);
  if (!mode) {
    return [];
  }

  const capabilities = getFixtureCapabilities(profile, mode);
  const attributes = Object.keys(capabilities.attributes);

  const palettes: Array<{ kind: CanonicalPalette['kind']; values: CanonicalAttributeValue[] }> = [];

  if (attributes.some((entry) => entry.startsWith('intensity.'))) {
    palettes.push({ kind: 'intensity', values: [createAttributeValue('intensity.dimmer', 75, 'percent')] });
  }

  if (attributes.some((entry) => entry.startsWith('color.'))) {
    palettes.push({ kind: 'color', values: [createAttributeValue('color.rgb', '#FFD18A', 'percent')] });
  }

  if (attributes.some((entry) => entry.startsWith('position.pan')) || attributes.some((entry) => entry.startsWith('position.tilt'))) {
    palettes.push({
      kind: 'position',
      values: [createAttributeValue('position.pan', 50, 'percent'), createAttributeValue('position.tilt', 50, 'percent')],
    });
  }

  if (attributes.some((entry) => entry.startsWith('beam.')) || attributes.some((entry) => entry.includes('strobe'))) {
    palettes.push({ kind: 'beam', values: [createAttributeValue('beam.zoom', 35, 'percent')] });
  }

  return palettes;
};

export const buildInitialGrouping = (
  fixtures: ReadonlyArray<CanonicalFixture>,
  rules: ReadonlyArray<InitialGroupingRule> = defaultRules,
): GroupProposal[] => {
  const enabledAxes = rules.filter((rule) => rule.enabled).map((rule) => rule.axis);
  const groupingMap = new Map<string, GroupProposal>();

  const addGroup = (axis: GroupAxis, source: string, fixtureId: string) => {
    const id = `grp-${slugify(axis)}-${slugify(source)}`;
    if (!groupingMap.has(id)) {
      groupingMap.set(id, {
        id,
        name: `${titleCase(axis)} · ${titleCase(source)}`,
        fixtureIds: [],
        axis,
        source,
      });
    }

    const group = groupingMap.get(id);
    if (group && !group.fixtureIds.includes(fixtureId)) {
      group.fixtureIds.push(fixtureId);
    }
  };

  fixtures.forEach((fixture) => {
    enabledAxes.forEach((axis) => {
      if (axis === 'fixtureType') addGroup(axis, fixture.fixtureType, fixture.id);
      if (axis === 'position') addGroup(axis, inferPositionFromName(fixture), fixture.id);
      if (axis === 'scenicRole') addGroup(axis, inferScenicRole(fixture), fixture.id);
      if (axis === 'zone') addGroup(axis, inferZone(fixture), fixture.id);
    });
  });

  return [...groupingMap.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const generateBasePalettes = (
  fixtures: ReadonlyArray<CanonicalFixture>,
  registry: FixtureProfileRegistry,
): PaletteProposal[] => {
  const paletteAccumulator = new Map<string, PaletteProposal>();

  fixtures.forEach((fixture) => {
    const inferred = inferPaletteValues(fixture, registry);
    inferred.forEach((entry) => {
      const id = `pal-${entry.kind}-base`;
      if (!paletteAccumulator.has(id)) {
        paletteAccumulator.set(id, {
          id,
          name: titleCase(`${entry.kind} base`),
          kind: entry.kind,
          values: [],
          coverage: 'partial',
          source: 'fixture-capabilities',
        });
      }

      const palette = paletteAccumulator.get(id);
      if (palette) {
        palette.values.push({ fixtureId: fixture.id, attributes: entry.values });
      }
    });
  });

  return [...paletteAccumulator.values()].map((palette) => ({
    ...palette,
    coverage: palette.values.length === fixtures.length ? 'global' : 'partial',
  }));
};

export const seedGroupsAndPalettes = (
  show: Pick<CanonicalShowModel, 'dmx'>,
  registry: FixtureProfileRegistry,
  rules?: ReadonlyArray<InitialGroupingRule>,
): SeededPaletteSet => ({
  groups: buildInitialGrouping(show.dmx.fixtures, rules),
  palettes: generateBasePalettes(show.dmx.fixtures, registry),
});

export const applyNamingAssistant = async (
  seed: SeededPaletteSet,
  assistant?: NamingAssistant,
): Promise<SeededPaletteSet> => {
  if (!assistant) {
    return seed;
  }

  const groups = await Promise.all(
    seed.groups.map(async (group) => {
      const suggestion = await assistant.suggestName({
        kind: 'group',
        baseName: group.name,
        fixtureIds: group.fixtureIds,
        category: group.axis,
      });

      return {
        ...group,
        name: suggestion.cleanedName || suggestion.readableName || group.name,
      };
    }),
  );

  const palettes = await Promise.all(
    seed.palettes.map(async (palette) => {
      const fixtureIds = palette.values.map((entry) => entry.fixtureId).filter((id): id is string => Boolean(id));
      const suggestion = await assistant.suggestName({
        kind: 'palette',
        baseName: palette.name,
        fixtureIds,
        category: palette.kind,
      });

      return {
        ...palette,
        name: suggestion.cleanedName || suggestion.readableName || palette.name,
      };
    }),
  );

  return { groups, palettes };
};

export const createValidatableDraft = (seed: SeededPaletteSet): ValidatableSeedDraft => ({
  groups: seed.groups.map((group) => ({ ...group, status: 'pending' })),
  palettes: seed.palettes.map((palette) => ({ ...palette, status: 'pending' })),
});

export const finalizeValidatedDraft = (draft: ValidatableSeedDraft): SeededPaletteSet => {
  const pendingItems = [...draft.groups, ...draft.palettes].filter((entry) => entry.status !== 'approved');
  if (pendingItems.length > 0) {
    throw new Error('Validation manuelle incomplète: approuvez ou retirez chaque proposition avant création finale.');
  }

  return {
    groups: draft.groups,
    palettes: draft.palettes,
  };
};
