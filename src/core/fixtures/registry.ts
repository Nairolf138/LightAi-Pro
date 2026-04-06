import {
  FIXTURE_PROFILE_FORMAT_VERSION,
  type FixtureProfile,
  type FixtureProfileCache,
  type FixtureProfileMode,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeMode = (mode: unknown, profileId: string): FixtureProfileMode => {
  if (!isRecord(mode) || typeof mode.id !== 'string' || typeof mode.name !== 'string') {
    throw new Error(`Invalid mode for profile "${profileId}"`);
  }

  if (!Array.isArray(mode.channels) || mode.channels.length === 0) {
    throw new Error(`Profile "${profileId}" mode "${mode.id}" must expose at least one channel`);
  }

  for (const channel of mode.channels) {
    if (!isRecord(channel) || typeof channel.key !== 'string' || typeof channel.name !== 'string') {
      throw new Error(`Profile "${profileId}" mode "${mode.id}" includes an invalid channel`);
    }
  }

  return mode as FixtureProfileMode;
};

const normalizeProfile = (profile: unknown): FixtureProfile => {
  if (!isRecord(profile)) {
    throw new Error('Fixture profile payload must be an object');
  }

  if (profile.format !== FIXTURE_PROFILE_FORMAT_VERSION) {
    throw new Error(`Unsupported fixture profile format: ${String(profile.format)}`);
  }

  if (
    typeof profile.profileId !== 'string' ||
    typeof profile.manufacturer !== 'string' ||
    typeof profile.model !== 'string'
  ) {
    throw new Error('Fixture profile metadata is invalid');
  }

  if (!Array.isArray(profile.modes) || profile.modes.length === 0) {
    throw new Error(`Fixture profile "${profile.profileId}" must provide modes`);
  }

  const normalizedModes = profile.modes.map((mode) => normalizeMode(mode, profile.profileId));
  return {
    ...profile,
    modes: normalizedModes,
  } as FixtureProfile;
};

export class FixtureProfileRegistry {
  private readonly profilesById = new Map<string, FixtureProfile>();

  constructor(private readonly cache?: FixtureProfileCache) {}

  async loadFromCache(): Promise<void> {
    if (!this.cache) {
      return;
    }

    const cachedProfiles = await this.cache.loadAll();
    for (const cachedProfile of cachedProfiles) {
      const normalizedProfile = normalizeProfile(cachedProfile);
      this.profilesById.set(normalizedProfile.profileId, normalizedProfile);
    }
  }

  listProfiles(): ReadonlyArray<FixtureProfile> {
    return [...this.profilesById.values()];
  }

  getProfile(profileId: string): FixtureProfile | undefined {
    return this.profilesById.get(profileId);
  }

  importProfiles(profiles: ReadonlyArray<FixtureProfile>): void {
    for (const profile of profiles) {
      const normalizedProfile = normalizeProfile(profile);
      this.profilesById.set(normalizedProfile.profileId, normalizedProfile);
    }
  }

  importProfilesFromJson(payload: string): void {
    const parsedPayload = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsedPayload)) {
      throw new Error('Fixture profile import payload must be an array');
    }

    const profiles = parsedPayload.map((item) => normalizeProfile(item));
    this.importProfiles(profiles);
  }

  async persist(): Promise<void> {
    if (!this.cache) {
      return;
    }

    await this.cache.saveAll(this.listProfiles());
  }
}
