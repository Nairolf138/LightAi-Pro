import type { FixtureProfile, FixtureProfileCache } from './types';

export class InMemoryFixtureProfileCache implements FixtureProfileCache {
  private profiles: FixtureProfile[] = [];

  async loadAll(): Promise<ReadonlyArray<FixtureProfile>> {
    return this.profiles;
  }

  async saveAll(profiles: ReadonlyArray<FixtureProfile>): Promise<void> {
    this.profiles = [...profiles];
  }
}
