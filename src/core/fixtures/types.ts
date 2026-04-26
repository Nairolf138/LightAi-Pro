export const DMX_UNIVERSE_MAX_CHANNELS = 512;
export const FIXTURE_PROFILE_FORMAT_VERSION = 'lightai.fixture.v1';

export type FixtureChannelValue = number;

export type FixtureChannelType =
  | 'intensity'
  | 'color'
  | 'position'
  | 'beam'
  | 'gobo'
  | 'effect'
  | 'strobe'
  | 'control'
  | 'custom';

export type FixtureChannelResolution = 8 | 16;

export interface FixtureChannelRange {
  min: number;
  max: number;
}

export interface FixtureChannelDefinition {
  key: string;
  name: string;
  type: FixtureChannelType;
  attribute?: string;
  aliases?: ReadonlyArray<string>;
  resolutionBits?: FixtureChannelResolution;
  fineKey?: string;
  range?: FixtureChannelRange;
  defaultValue?: FixtureChannelValue;
}

export interface FixtureMacroDefinition {
  id: string;
  name: string;
  channelKeys: ReadonlyArray<string>;
}

export interface FixtureModeLimitations {
  unsupportedAttributes?: ReadonlyArray<string>;
  notes?: ReadonlyArray<string>;
}

export interface FixtureProfileMode {
  id: string;
  name: string;
  channels: ReadonlyArray<FixtureChannelDefinition>;
  macros?: ReadonlyArray<FixtureMacroDefinition>;
  limitations?: FixtureModeLimitations;
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
