import type { PatchFixture } from '../../core/fixtures/types';
import type { FixtureProfileRegistry } from '../../core/fixtures/registry';

export type PatchAuditStableCode =
  | 'PA_DMX_ADDRESS_CONFLICT'
  | 'PA_UNIVERSE_OVERLAP'
  | 'PA_FIXTURE_MODE_INCONSISTENT'
  | 'PA_CHANNEL_OUT_OF_RANGE';

export interface PatchAuditFinding {
  code: PatchAuditStableCode;
  fixtureId?: string;
  universe?: number;
  message: string;
}

export interface PatchAuditSuggestion {
  code: 'PA_SUGGEST_REPATCH' | 'PA_SUGGEST_PROFILE_REVIEW';
  fixtureId?: string;
  universe?: number;
  message: string;
}

export interface PatchAuditResult {
  issues: PatchAuditFinding[];
  warnings: PatchAuditFinding[];
  propositions: PatchAuditSuggestion[];
  severity: {
    global: number;
    byUniverse: Record<number, number>;
  };
  durationMs: number;
}

export type PatchAuditInput =
  | string
  | {
      fixtures?: unknown;
    }
  | ReadonlyArray<unknown>;

const MAX_DMX_CHANNEL = 512;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizePatchInput = (input: PatchAuditInput): PatchFixture[] => {
  const parsed =
    typeof input === 'string'
      ? (input.trim().startsWith('{') || input.trim().startsWith('[')
          ? (JSON.parse(input) as unknown)
          : input)
      : input;

  if (typeof parsed === 'string') {
    const rows = parsed.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line.length > 0);
    if (rows.length < 2) {
      return [];
    }
    const headers = rows[0].split(',').map((cell) => cell.trim().toLowerCase());
    return rows.slice(1).map((row, index) => {
      const cells = row.split(',').map((cell) => cell.trim());
      const get = (key: string): string => cells[headers.indexOf(key)] ?? '';
      return {
        id: get('id') || `fixture-${index + 1}`,
        name: get('name') || get('id') || `fixture-${index + 1}`,
        profileId: get('profileid'),
        modeId: get('modeid'),
        universe: toNumber(get('universe')) ?? 0,
        address: toNumber(get('address')) ?? 0,
      };
    });
  }

  const rawFixtures = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { fixtures?: unknown }).fixtures)
      ? ((parsed as { fixtures: unknown[] }).fixtures as unknown[])
      : [];

  return rawFixtures
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map((entry, index) => ({
      id: String(entry.id ?? entry.fixtureId ?? `fixture-${index + 1}`),
      name: String(entry.name ?? entry.label ?? entry.id ?? `fixture-${index + 1}`),
      profileId: String(entry.profileId ?? entry.fixtureType ?? ''),
      modeId: String(entry.modeId ?? entry.mode ?? ''),
      universe: toNumber(entry.universe ?? entry.patchUniverse) ?? 0,
      address: toNumber(entry.address ?? entry.patchAddress) ?? 0,
    }));
};

export const runPatchAudit = (input: PatchAuditInput, registry: FixtureProfileRegistry): PatchAuditResult => {
  const started = performance.now();
  const fixtures = normalizePatchInput(input);
  const issues: PatchAuditFinding[] = [];
  const warnings: PatchAuditFinding[] = [];
  const propositions: PatchAuditSuggestion[] = [];
  const byUniverse = new Map<number, number>();

  const addScore = (universe: number | undefined, points: number): void => {
    if (typeof universe !== 'number') {
      return;
    }
    byUniverse.set(universe, (byUniverse.get(universe) ?? 0) + points);
  };

  const occupancy = new Map<string, string>();

  fixtures.forEach((fixture) => {
    const profile = registry.getProfile(fixture.profileId);
    const mode = profile?.modes.find((entry) => entry.id === fixture.modeId);
    const footprint = mode?.channels.length ?? 0;

    if (!mode) {
      issues.push({
        code: 'PA_FIXTURE_MODE_INCONSISTENT',
        fixtureId: fixture.id,
        universe: fixture.universe,
        message: `Mode incohérent pour ${fixture.id}: ${fixture.profileId}/${fixture.modeId}.`,
      });
      propositions.push({
        code: 'PA_SUGGEST_PROFILE_REVIEW',
        fixtureId: fixture.id,
        universe: fixture.universe,
        message: `Vérifier le profileId/modeId de ${fixture.id}.`,
      });
      addScore(fixture.universe, 40);
    }

    if (fixture.address < 1 || fixture.address > MAX_DMX_CHANNEL) {
      issues.push({
        code: 'PA_CHANNEL_OUT_OF_RANGE',
        fixtureId: fixture.id,
        universe: fixture.universe,
        message: `Adresse DMX hors plage pour ${fixture.id}: ${fixture.address}.`,
      });
      addScore(fixture.universe, 50);
      return;
    }

    const endAddress = fixture.address + Math.max(footprint - 1, 0);
    if (endAddress > MAX_DMX_CHANNEL) {
      issues.push({
        code: 'PA_CHANNEL_OUT_OF_RANGE',
        fixtureId: fixture.id,
        universe: fixture.universe,
        message: `Footprint dépasse 512 pour ${fixture.id}: ${fixture.address}-${endAddress}.`,
      });
      addScore(fixture.universe, 50);
    }

    for (let channel = fixture.address; channel <= Math.min(endAddress, MAX_DMX_CHANNEL); channel += 1) {
      const key = `${fixture.universe}:${channel}`;
      const owner = occupancy.get(key);
      if (owner) {
        issues.push({
          code: 'PA_DMX_ADDRESS_CONFLICT',
          fixtureId: fixture.id,
          universe: fixture.universe,
          message: `Conflit DMX ${fixture.universe}/${channel} entre ${owner} et ${fixture.id}.`,
        });
        propositions.push({
          code: 'PA_SUGGEST_REPATCH',
          fixtureId: fixture.id,
          universe: fixture.universe,
          message: `Repatch recommandé pour ${fixture.id} (univers ${fixture.universe}).`,
        });
        addScore(fixture.universe, 80);
      } else {
        occupancy.set(key, fixture.id);
      }
    }
  });

  const fixturesByUniverse = new Map<number, PatchFixture[]>();
  fixtures.forEach((fixture) => {
    const collection = fixturesByUniverse.get(fixture.universe) ?? [];
    collection.push(fixture);
    fixturesByUniverse.set(fixture.universe, collection);
  });

  fixturesByUniverse.forEach((universeFixtures, universe) => {
    const sorted = [...universeFixtures].sort((a, b) => a.address - b.address);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const previousFootprint = registry.getProfile(previous.profileId)?.modes.find((mode) => mode.id === previous.modeId)?.channels.length ?? 1;
      const previousEnd = previous.address + previousFootprint - 1;
      if (current.address <= previousEnd && current.id !== previous.id) {
        warnings.push({
          code: 'PA_UNIVERSE_OVERLAP',
          fixtureId: current.id,
          universe,
          message: `Chevauchement univers ${universe}: ${previous.id} recouvre ${current.id}.`,
        });
        addScore(universe, 20);
      }
    }
  });

  const durationMs = Number((performance.now() - started).toFixed(2));
  const byUniverseRecord = Object.fromEntries([...byUniverse.entries()].sort((a, b) => a[0] - b[0]));
  const globalSeverity = Math.min(100, [...byUniverse.values()].reduce((acc, value) => acc + value, 0));

  return {
    issues,
    warnings,
    propositions,
    severity: { global: globalSeverity, byUniverse: byUniverseRecord },
    durationMs,
  };
};
