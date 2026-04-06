import type { DmxDriverConfig, LightingOutputDriver, UniverseFrame } from '../../types';

export interface DmxUsbInterface {
  readonly id: string;
  open(): Promise<void>;
  close(): Promise<void>;
  writeUniverse(frame: UniverseFrame): Promise<void>;
}

export interface DmxDriverDependencies {
  interfaces: ReadonlyArray<DmxUsbInterface>;
}

export class DmxUsbOutputDriver implements LightingOutputDriver {
  readonly metadata = {
    kind: 'dmx' as const,
    name: 'DMX USB output driver',
  };

  private readonly interfacesById: Readonly<Record<string, DmxUsbInterface>>;

  constructor(
    private readonly config: DmxDriverConfig,
    dependencies: DmxDriverDependencies,
  ) {
    this.interfacesById = Object.fromEntries(
      dependencies.interfaces.map((dmxInterface) => [dmxInterface.id, dmxInterface]),
    );
  }

  async connect(): Promise<void> {
    for (const dmxInterface of Object.values(this.interfacesById)) {
      await dmxInterface.open();
    }
  }

  async disconnect(): Promise<void> {
    for (const dmxInterface of Object.values(this.interfacesById)) {
      await dmxInterface.close();
    }
  }

  async sendUniverse(universe: number, frame: UniverseFrame): Promise<void> {
    const binding = this.config.universeBindings?.find((candidate) => candidate.universe === universe);
    const fallbackInterfaceId = this.config.interfaces?.[0];
    const targetInterfaceId = binding?.interfaceId ?? fallbackInterfaceId;

    if (!targetInterfaceId) {
      return;
    }

    const dmxInterface = this.interfacesById[targetInterfaceId];
    if (!dmxInterface) {
      throw new Error(`DMX interface "${targetInterfaceId}" unavailable`);
    }

    await dmxInterface.writeUniverse(frame);
  }

  async sendUniverses(universes: Readonly<Record<number, UniverseFrame>>): Promise<void> {
    const universesAsEntries = Object.entries(universes);
    for (const [universeAsString, frame] of universesAsEntries) {
      await this.sendUniverse(Number(universeAsString), frame);
    }
  }
}
