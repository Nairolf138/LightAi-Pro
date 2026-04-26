import type { CanonicalFixture, CanonicalFixtureMode, CanonicalShowModel } from '../show/canonical';
import { validatePatchFixtures } from './patch-editor';
import type {
  FixtureChannelType,
  FixtureProfile,
  FixtureProfileMode,
  PatchFixture,
  PatchValidationIssue,
} from './types';
import type { FixtureProfileRegistry } from './registry';

export type PatchSourceFormat = 'csv' | 'consoleExportJson' | 'internalPatchJson';

export const PATCH_SOURCE_FORMAT_PRIORITIES: ReadonlyArray<{ format: PatchSourceFormat; priority: number; description: string }> = [
  {
    format: 'csv',
    priority: 1,
    description: 'CSV tabulaire (id,name,profileId,modeId,universe,address) pour imports rapides terrain.',
  },
  {
    format: 'consoleExportJson',
    priority: 2,
    description: 'Exports JSON consoles (fixtures[]) avec normalisation des clés fixture/mode/address.',
  },
  {
    format: 'internalPatchJson',
    priority: 3,
    description: 'Formats internes LightAi (PatchFixture[] ou { patch: { fixtures } } ou show canonique).',
  },
];

export interface PatchImportMessage {
  severity: 'blocking' | 'warning';
  code:
    | 'invalidPayload'
    | 'unknownFormat'
    | 'missingField'
    | 'invalidNumber'
    | 'duplicateFixtureId'
    | 'unknownProfile'
    | 'invalidMode'
    | 'addressCollision'
    | 'universeOverflow';
  fixtureId?: string;
  line?: number;
  message: string;
}

export interface PatchValidationReport {
  blockingErrors: PatchImportMessage[];
  warnings: PatchImportMessage[];
  readableSummary: string;
}

export interface ParsedPatchResult {
  detectedFormat: PatchSourceFormat;
  fixtures: PatchFixture[];
  report: PatchValidationReport;
}

type ParseContext = {
  payload: string | unknown;
};

type PatchSourceParser = {
  format: PatchSourceFormat;
  detect: (context: ParseContext) => boolean;
  parse: (context: ParseContext) => { fixtures: PatchFixture[]; messages: PatchImportMessage[] };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const csvParser: PatchSourceParser = {
  format: 'csv',
  detect: ({ payload }) => {
    if (typeof payload !== 'string') {
      return false;
    }

    const firstLine = payload.split(/\r?\n/u).find((line) => line.trim().length > 0) ?? '';
    return /profileid/i.test(firstLine) && /address/i.test(firstLine);
  },
  parse: ({ payload }) => {
    if (typeof payload !== 'string') {
      return {
        fixtures: [],
        messages: [{ severity: 'blocking', code: 'invalidPayload', message: 'Le payload CSV doit être une chaîne.' }],
      };
    }

    const lines = payload
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return {
        fixtures: [],
        messages: [{ severity: 'blocking', code: 'invalidPayload', message: 'Le CSV doit contenir un header et au moins une ligne.' }],
      };
    }

    const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
    const requiredHeaders = ['id', 'name', 'profileid', 'modeid', 'universe', 'address'];
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return {
        fixtures: [],
        messages: [
          {
            severity: 'blocking',
            code: 'missingField',
            message: `Header CSV incomplet, champs requis manquants: ${missingHeaders.join(', ')}`,
          },
        ],
      };
    }

    const fixtures: PatchFixture[] = [];
    const messages: PatchImportMessage[] = [];

    lines.slice(1).forEach((line, index) => {
      const columns = line.split(',').map((item) => item.trim());
      const getValue = (header: string): string => columns[headers.indexOf(header)] ?? '';

      const id = getValue('id');
      const name = getValue('name');
      const profileId = getValue('profileid');
      const modeId = getValue('modeid');
      const universe = toNumber(getValue('universe'));
      const address = toNumber(getValue('address'));
      const lineNumber = index + 2;

      if (!id || !name || !profileId || !modeId) {
        messages.push({
          severity: 'blocking',
          code: 'missingField',
          line: lineNumber,
          message: `Ligne ${lineNumber}: champs texte requis manquants (id/name/profileId/modeId).`,
        });
        return;
      }

      if (universe === null || address === null) {
        messages.push({
          severity: 'blocking',
          code: 'invalidNumber',
          line: lineNumber,
          message: `Ligne ${lineNumber}: universe/address doivent être numériques.`,
        });
        return;
      }

      fixtures.push({ id, name, profileId, modeId, universe, address });
    });

    return { fixtures, messages };
  },
};

const parseJsonLikePayload = (payload: string | unknown): unknown => {
  if (typeof payload === 'string') {
    return JSON.parse(payload) as unknown;
  }

  return payload;
};

const consoleJsonParser: PatchSourceParser = {
  format: 'consoleExportJson',
  detect: ({ payload }) => {
    try {
      const parsed = parseJsonLikePayload(payload);
      if (!isRecord(parsed) || !Array.isArray(parsed.fixtures)) {
        return false;
      }

      return parsed.fixtures.every((entry) => isRecord(entry) && ('fixtureType' in entry || 'mode' in entry || 'patch' in entry));
    } catch {
      return false;
    }
  },
  parse: ({ payload }) => {
    try {
      const parsed = parseJsonLikePayload(payload);
      if (!isRecord(parsed) || !Array.isArray(parsed.fixtures)) {
        return {
          fixtures: [],
          messages: [{ severity: 'blocking', code: 'invalidPayload', message: 'Export console invalide: fixtures[] introuvable.' }],
        };
      }

      const fixtures: PatchFixture[] = [];
      const messages: PatchImportMessage[] = [];
      parsed.fixtures.forEach((entry, index) => {
        if (!isRecord(entry)) {
          messages.push({
            severity: 'blocking',
            code: 'invalidPayload',
            line: index + 1,
            message: `Fixture export #${index + 1} invalide.`,
          });
          return;
        }

        const id = String(entry.fixtureId ?? entry.id ?? `fx-${index + 1}`);
        const name = String(entry.label ?? entry.name ?? id);
        const profileId = String(entry.fixtureType ?? entry.profileId ?? 'unknown-profile');
        const modeId = String(entry.mode ?? entry.modeId ?? 'default');
        const universe = toNumber(entry.universe ?? entry.patchUniverse);
        const address = toNumber(entry.address ?? entry.patchAddress);

        if (universe === null || address === null) {
          messages.push({
            severity: 'blocking',
            code: 'invalidNumber',
            fixtureId: id,
            message: `Fixture ${id}: universe/address manquants ou invalides.`,
          });
          return;
        }

        fixtures.push({ id, name, profileId, modeId, universe, address });
      });

      return { fixtures, messages };
    } catch {
      return {
        fixtures: [],
        messages: [{ severity: 'blocking', code: 'invalidPayload', message: 'JSON export console illisible.' }],
      };
    }
  },
};

const internalJsonParser: PatchSourceParser = {
  format: 'internalPatchJson',
  detect: ({ payload }) => {
    try {
      const parsed = parseJsonLikePayload(payload);
      if (Array.isArray(parsed)) {
        return parsed.every((entry) => isRecord(entry) && 'profileId' in entry && 'modeId' in entry);
      }

      if (!isRecord(parsed)) {
        return false;
      }

      return (
        (isRecord(parsed.patch) && Array.isArray(parsed.patch.fixtures)) ||
        (isRecord(parsed.dmx) && Array.isArray(parsed.dmx.fixtures))
      );
    } catch {
      return false;
    }
  },
  parse: ({ payload }) => {
    try {
      const parsed = parseJsonLikePayload(payload);

      const rawFixtures =
        Array.isArray(parsed)
          ? parsed
          : isRecord(parsed) && isRecord(parsed.patch) && Array.isArray(parsed.patch.fixtures)
            ? parsed.patch.fixtures
            : isRecord(parsed) && isRecord(parsed.dmx) && Array.isArray(parsed.dmx.fixtures)
              ? parsed.dmx.fixtures
              : [];

      const fixtures: PatchFixture[] = [];
      const messages: PatchImportMessage[] = [];

      rawFixtures.forEach((entry, index) => {
        if (!isRecord(entry)) {
          messages.push({ severity: 'blocking', code: 'invalidPayload', line: index + 1, message: 'Fixture interne invalide.' });
          return;
        }

        const id = typeof entry.id === 'string' ? entry.id : `fixture-${index + 1}`;
        const name = typeof entry.name === 'string' ? entry.name : id;
        const profileId = typeof entry.profileId === 'string' ? entry.profileId : typeof entry.fixtureType === 'string' ? entry.fixtureType : '';
        const modeId = typeof entry.modeId === 'string' ? entry.modeId : '';
        const universe = toNumber(entry.universe);
        const address = toNumber(entry.address);

        if (!profileId || !modeId || universe === null || address === null) {
          messages.push({
            severity: 'blocking',
            code: 'missingField',
            fixtureId: id,
            message: `Fixture ${id}: profileId/modeId/universe/address requis.`,
          });
          return;
        }

        fixtures.push({ id, name, profileId, modeId, universe, address });
      });

      return { fixtures, messages };
    } catch {
      return {
        fixtures: [],
        messages: [{ severity: 'blocking', code: 'invalidPayload', message: 'JSON interne illisible.' }],
      };
    }
  },
};

const parsers = [csvParser, consoleJsonParser, internalJsonParser] as const;

const mapPatchValidationIssue = (issue: PatchValidationIssue): PatchImportMessage => {
  switch (issue.type) {
    case 'missingProfile':
      return { severity: 'blocking', code: 'unknownProfile', fixtureId: issue.fixtureId, message: issue.message };
    case 'missingMode':
      return { severity: 'blocking', code: 'invalidMode', fixtureId: issue.fixtureId, message: issue.message };
    case 'addressCollision':
      return { severity: 'blocking', code: 'addressCollision', fixtureId: issue.fixtureId, message: issue.message };
    case 'universeOverflow':
      return { severity: 'blocking', code: 'universeOverflow', fixtureId: issue.fixtureId, message: issue.message };
    default:
      return { severity: 'blocking', code: 'invalidPayload', fixtureId: issue.fixtureId, message: issue.message };
  }
};

const buildReport = (messages: PatchImportMessage[]): PatchValidationReport => {
  const blockingErrors = messages.filter((message) => message.severity === 'blocking');
  const warnings = messages.filter((message) => message.severity === 'warning');

  const readableSummary =
    `Validation patch: ${blockingErrors.length} erreur(s) bloquante(s), ` +
    `${warnings.length} avertissement(s).`;

  return { blockingErrors, warnings, readableSummary };
};

export const parsePatchSource = (
  payload: string | unknown,
  registry: FixtureProfileRegistry,
): ParsedPatchResult => {
  const parser = parsers.find((candidate) => candidate.detect({ payload }));
  if (!parser) {
    const report = buildReport([
      {
        severity: 'blocking',
        code: 'unknownFormat',
        message: 'Format patch source inconnu. Formats prioritaires: csv, consoleExportJson, internalPatchJson.',
      },
    ]);

    return {
      detectedFormat: 'internalPatchJson',
      fixtures: [],
      report,
    };
  }

  const parsed = parser.parse({ payload });
  const duplicateMessages: PatchImportMessage[] = [];
  const seenIds = new Set<string>();

  parsed.fixtures.forEach((fixture) => {
    if (seenIds.has(fixture.id)) {
      duplicateMessages.push({
        severity: 'blocking',
        code: 'duplicateFixtureId',
        fixtureId: fixture.id,
        message: `Identifiant fixture dupliqué: "${fixture.id}".`,
      });
      return;
    }

    seenIds.add(fixture.id);
  });

  const validatorMessages = validatePatchFixtures(parsed.fixtures, registry).map(mapPatchValidationIssue);
  const report = buildReport([...parsed.messages, ...duplicateMessages, ...validatorMessages]);

  return {
    detectedFormat: parser.format,
    fixtures: parsed.fixtures,
    report,
  };
};

const channelTypeToFamily = (channelType: FixtureChannelType): CanonicalShowModel['attributesCatalog'][number]['family'] => {
  switch (channelType) {
    case 'intensity':
      return 'dimmer';
    case 'color':
      return 'color';
    case 'position':
      return 'position';
    case 'gobo':
      return 'gobo';
    case 'beam':
      return 'beam';
    case 'control':
    case 'effect':
    case 'strobe':
    case 'custom':
    default:
      return 'focus';
  }
};

const toCanonicalFixtureMode = (profile: FixtureProfile, mode: FixtureProfileMode): CanonicalFixtureMode => ({
  id: mode.id,
  name: `${profile.manufacturer} ${profile.model} ${mode.name}`,
  dmxFootprint: mode.channels.length,
  attributes: mode.channels.map((channel, index) => ({
    attributeId: `${channel.type}.${channel.key}`,
    channels: [index + 1],
    coarseChannel: index + 1,
    defaultValue: channel.defaultValue,
  })),
});

const toCanonicalFixture = (fixture: PatchFixture): CanonicalFixture => ({
  id: fixture.id,
  name: fixture.name,
  fixtureType: fixture.profileId,
  modeId: fixture.modeId,
  universe: fixture.universe,
  address: fixture.address,
});

export const buildShowGraphFromPatch = (
  fixtures: ReadonlyArray<PatchFixture>,
  registry: FixtureProfileRegistry,
  metadata?: { showId?: string; title?: string; bpm?: number },
): CanonicalShowModel => {
  const universeIds = [...new Set(fixtures.map((fixture) => fixture.universe))].sort((left, right) => left - right);
  const fixtureModes = new Map<string, CanonicalFixtureMode>();
  const attributesCatalog = new Map<string, CanonicalShowModel['attributesCatalog'][number]>();

  for (const fixture of fixtures) {
    const profile = registry.getProfile(fixture.profileId);
    const mode = profile?.modes.find((candidate) => candidate.id === fixture.modeId);
    if (!profile || !mode) {
      continue;
    }

    if (!fixtureModes.has(mode.id)) {
      fixtureModes.set(mode.id, toCanonicalFixtureMode(profile, mode));
    }

    mode.channels.forEach((channel) => {
      const attributeId = `${channel.type}.${channel.key}`;
      if (!attributesCatalog.has(attributeId)) {
        attributesCatalog.set(attributeId, {
          id: attributeId,
          family: channelTypeToFamily(channel.type),
          label: channel.name,
        });
      }
    });
  }

  return {
    schemaVersion: '1.0.0',
    metadata: {
      showId: metadata?.showId ?? 'show-from-patch',
      title: metadata?.title ?? 'Imported Patch',
      bpm: metadata?.bpm,
    },
    dmx: {
      universes: universeIds.map((id) => ({ id, name: `Universe ${id}` })),
      fixtureModes: [...fixtureModes.values()],
      fixtures: fixtures.map(toCanonicalFixture),
    },
    attributesCatalog: [...attributesCatalog.values()],
    groups: [],
    palettes: [],
    cues: [],
    consoleMappings: [],
  };
};
