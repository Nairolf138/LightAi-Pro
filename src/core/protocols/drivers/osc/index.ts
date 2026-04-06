import type { LightingOutputDriver, OscDriverConfig, UniverseFrame } from '../../types';

export interface OscMessage {
  readonly address: string;
  readonly args: ReadonlyArray<number>;
}

export interface OscTransport {
  send(targetUrl: string, message: OscMessage): Promise<void>;
}

export interface OscDriverDependencies {
  transport: OscTransport;
}

const DEFAULT_OSC_ADDRESS = '/lighting/universe';

const getAddressForUniverse = (config: OscDriverConfig, universe: number): string => {
  const mappedAddress = config.universeAddressMap?.[universe];
  if (mappedAddress) {
    return mappedAddress;
  }
  if (config.defaultAddress) {
    return config.defaultAddress;
  }
  return `${DEFAULT_OSC_ADDRESS}/${universe}`;
};

export class OscOutputDriver implements LightingOutputDriver {
  readonly metadata = {
    kind: 'osc' as const,
    name: 'OSC output driver',
  };

  constructor(
    private readonly config: OscDriverConfig,
    private readonly dependencies: OscDriverDependencies,
  ) {}

  async connect(): Promise<void> {
    // No-op by default; transport can open lazily.
  }

  async disconnect(): Promise<void> {
    // No-op by default.
  }

  async sendUniverse(universe: number, frame: UniverseFrame): Promise<void> {
    const address = getAddressForUniverse(this.config, universe);
    const message: OscMessage = {
      address,
      args: frame.map((value) => Math.max(0, Math.min(255, Math.round(value)))),
    };

    await this.dependencies.transport.send(this.config.targetUrl, message);
  }

  async sendUniverses(universes: Readonly<Record<number, UniverseFrame>>): Promise<void> {
    const universesAsEntries = Object.entries(universes);
    for (const [universeAsString, frame] of universesAsEntries) {
      await this.sendUniverse(Number(universeAsString), frame);
    }
  }
}
