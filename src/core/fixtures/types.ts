export const DMX_UNIVERSE_MAX_CHANNELS = 512;
export const FIXTURE_PROFILE_FORMAT_VERSION = 'lightai.fixture.v1';

export type FixtureChannelValue = number;

export type FixtureChannelType =
  | 'intensity'
  | 'color'
  | 'position'
  | 'effect'
  | 'strobe'
  | 'control'
  | 'custom';

export interface FixtureChannelDefinition {
  key: string;
  name: string;
  type: FixtureChannelType;
  defaultValue?: FixtureChannelValue;
}

export interface FixtureProfileMode {
  id: string;
  name: string;
  channels: ReadonlyArray<FixtureChannelDefinition>;
}

export interface FixtureProfile {
  /**
   * Internal format inspired by Open Fixture Library mode/channel model.
   */
  format: typeof FIXTURE_PROFILE_FORMAT_VERSION;
  manufacturer: string;
  model: string;
  profileId: string;
  modes: ReadonlyArray<FixtureProfileMode>;
}

export interface PatchFixture {
  id: string;
  name: string;
  profileId: string;
  modeId: string;
  universe: number;
  address: number;
}

export interface PatchValidationIssue {
  type: 'missingProfile' | 'missingMode' | 'addressCollision' | 'universeOverflow';
  fixtureId: string;
  message: string;
  channels?: number[];
}

export interface PatchedChannelMapping {
  fixtureId: string;
  fixtureName: string;
  profileId: string;
  modeId: string;
  channelKey: string;
  channelName: string;
  universe: number;
  address: number;
  defaultValue: number;
}

export interface PatchRenderMapping {
  channelMappings: ReadonlyArray<PatchedChannelMapping>;
  universeFrames: Readonly<Record<number, ReadonlyArray<number>>>;
}

export interface FixtureProfileCache {
  loadAll(): Promise<ReadonlyArray<FixtureProfile>>;
  saveAll(profiles: ReadonlyArray<FixtureProfile>): Promise<void>;
}
