import {
  DMX_UNIVERSE_MAX_CHANNELS,
  type PatchFixture,
  type PatchValidationIssue,
  type PatchedChannelMapping,
  type PatchRenderMapping,
} from './types';
import type { FixtureProfileRegistry } from './registry';

const clampChannelByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const getFixtureChannelCount = (fixture: PatchFixture, registry: FixtureProfileRegistry): number => {
  const profile = registry.getProfile(fixture.profileId);
  if (!profile) {
    return 0;
  }

  const mode = profile.modes.find((candidate) => candidate.id === fixture.modeId);
  if (!mode) {
    return 0;
  }

  return mode.channels.length;
};

const getFixtureAddresses = (
  fixture: PatchFixture,
  registry: FixtureProfileRegistry,
): ReadonlyArray<number> => {
  const count = getFixtureChannelCount(fixture, registry);
  const addresses: number[] = [];
  for (let index = 0; index < count; index += 1) {
    addresses.push(fixture.address + index);
  }
  return addresses;
};

export const validatePatchFixtures = (
  fixtures: ReadonlyArray<PatchFixture>,
  registry: FixtureProfileRegistry,
): ReadonlyArray<PatchValidationIssue> => {
  const issues: PatchValidationIssue[] = [];
  const occupiedAddresses = new Map<string, string>();

  for (const fixture of fixtures) {
    const profile = registry.getProfile(fixture.profileId);
    if (!profile) {
      issues.push({
        type: 'missingProfile',
        fixtureId: fixture.id,
        message: `Fixture "${fixture.name}" references unknown profile "${fixture.profileId}"`,
      });
      continue;
    }

    const mode = profile.modes.find((candidate) => candidate.id === fixture.modeId);
    if (!mode) {
      issues.push({
        type: 'missingMode',
        fixtureId: fixture.id,
        message: `Fixture "${fixture.name}" references unknown mode "${fixture.modeId}"`,
      });
      continue;
    }

    const startAddress = fixture.address;
    const endAddress = fixture.address + mode.channels.length - 1;
    if (startAddress < 1 || endAddress > DMX_UNIVERSE_MAX_CHANNELS) {
      issues.push({
        type: 'universeOverflow',
        fixtureId: fixture.id,
        channels: [startAddress, endAddress],
        message:
          `Fixture "${fixture.name}" overflow in universe ${fixture.universe}: ` +
          `channels ${startAddress}..${endAddress} outside 1..${DMX_UNIVERSE_MAX_CHANNELS}`,
      });
      continue;
    }

    const addresses = getFixtureAddresses(fixture, registry);
    for (const address of addresses) {
      const key = `${fixture.universe}:${address}`;
      const existingFixtureId = occupiedAddresses.get(key);
      if (existingFixtureId && existingFixtureId !== fixture.id) {
        issues.push({
          type: 'addressCollision',
          fixtureId: fixture.id,
          channels: [address],
          message:
            `Collision on universe ${fixture.universe} address ${address} ` +
            `between fixtures "${existingFixtureId}" and "${fixture.id}"`,
        });
        continue;
      }

      occupiedAddresses.set(key, fixture.id);
    }
  }

  return issues;
};

export class FixturePatchEditor {
  private fixturesById = new Map<string, PatchFixture>();

  constructor(private readonly registry: FixtureProfileRegistry) {}

  listFixtures(): ReadonlyArray<PatchFixture> {
    return [...this.fixturesById.values()];
  }

  upsertFixture(fixture: PatchFixture): void {
    this.fixturesById.set(fixture.id, fixture);
  }

  removeFixture(fixtureId: string): void {
    this.fixturesById.delete(fixtureId);
  }

  validate(): ReadonlyArray<PatchValidationIssue> {
    return validatePatchFixtures(this.listFixtures(), this.registry);
  }

  buildRenderMapping(): PatchRenderMapping {
    const issues = this.validate();
    if (issues.length > 0) {
      throw new Error(`Patch includes ${issues.length} blocking issue(s)`);
    }

    const channelMappings: PatchedChannelMapping[] = [];
    const universeFrames = new Map<number, number[]>();

    for (const fixture of this.listFixtures()) {
      const profile = this.registry.getProfile(fixture.profileId);
      if (!profile) {
        continue;
      }

      const mode = profile.modes.find((candidate) => candidate.id === fixture.modeId);
      if (!mode) {
        continue;
      }

      if (!universeFrames.has(fixture.universe)) {
        universeFrames.set(fixture.universe, Array.from({ length: DMX_UNIVERSE_MAX_CHANNELS }, () => 0));
      }

      const frame = universeFrames.get(fixture.universe);
      if (!frame) {
        continue;
      }

      mode.channels.forEach((channel, index) => {
        const address = fixture.address + index;
        const defaultValue = clampChannelByte(channel.defaultValue ?? 0);
        frame[address - 1] = defaultValue;

        channelMappings.push({
          fixtureId: fixture.id,
          fixtureName: fixture.name,
          profileId: fixture.profileId,
          modeId: fixture.modeId,
          channelKey: channel.key,
          channelName: channel.name,
          universe: fixture.universe,
          address,
          defaultValue,
        });
      });
    }

    return {
      channelMappings,
      universeFrames: Object.fromEntries(universeFrames.entries()),
    };
  }
}
