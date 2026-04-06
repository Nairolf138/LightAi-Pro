export type UniverseFrame = ReadonlyArray<number>;

export type DriverKind = 'artnet' | 'dmx' | 'osc' | 'simulator';

export interface DriverMetadata {
  readonly kind: DriverKind;
  readonly name: string;
}

export interface LightingOutputDriver {
  readonly metadata: DriverMetadata;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendUniverse(universe: number, frame: UniverseFrame): Promise<void>;
  sendUniverses(universes: Readonly<Record<number, UniverseFrame>>): Promise<void>;
}

export interface ArtNetDriverConfig {
  readonly kind: 'artnet';
  readonly host: string;
  readonly port?: number;
  readonly sourceName?: string;
}

export interface DmxUniverseBinding {
  readonly universe: number;
  readonly interfaceId: string;
}

export interface DmxDriverConfig {
  readonly kind: 'dmx';
  readonly interfaces?: ReadonlyArray<string>;
  readonly universeBindings?: ReadonlyArray<DmxUniverseBinding>;
}

export interface OscDriverConfig {
  readonly kind: 'osc';
  readonly targetUrl: string;
  readonly defaultAddress?: string;
  readonly universeAddressMap?: Readonly<Record<number, string>>;
}

export interface SimulatorDriverConfig {
  readonly kind: 'simulator';
  readonly latencyMs?: number;
  readonly logFrames?: boolean;
}

export interface ShowOutputConfig {
  readonly activeDriver: DriverKind;
  readonly artnet?: ArtNetDriverConfig;
  readonly dmx?: DmxDriverConfig;
  readonly osc?: OscDriverConfig;
  readonly simulator?: SimulatorDriverConfig;
}

export const defaultShowOutputConfig: ShowOutputConfig = {
  activeDriver: 'simulator',
  simulator: {
    kind: 'simulator',
    latencyMs: 0,
    logFrames: false,
  },
};
