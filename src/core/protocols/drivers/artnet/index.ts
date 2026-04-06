import type { ArtNetDriverConfig, LightingOutputDriver, UniverseFrame } from '../../types';

const ARTNET_HEADER = 'Art-Net\u0000';
const OP_OUTPUT = 0x5000;
const PROTOCOL_VERSION = 14;
const DEFAULT_ARTNET_PORT = 6454;

export interface ArtNetTransport {
  send(packet: Uint8Array, port: number, host: string): Promise<void>;
}

export interface ArtNetDriverDependencies {
  transport: ArtNetTransport;
}

const buildArtNetPacket = (universe: number, frame: UniverseFrame): Uint8Array => {
  const safeUniverse = Math.max(0, Math.min(0x7fff, Math.floor(universe)));
  const length = Math.max(2, Math.min(512, frame.length));
  const evenLength = length % 2 === 0 ? length : length + 1;
  const packet = new Uint8Array(18 + evenLength);

  for (let index = 0; index < ARTNET_HEADER.length; index += 1) {
    packet[index] = ARTNET_HEADER.charCodeAt(index);
  }

  packet[8] = OP_OUTPUT & 0xff;
  packet[9] = (OP_OUTPUT >> 8) & 0xff;
  packet[10] = (PROTOCOL_VERSION >> 8) & 0xff;
  packet[11] = PROTOCOL_VERSION & 0xff;
  packet[12] = 0;
  packet[13] = 0;
  packet[14] = safeUniverse & 0xff;
  packet[15] = (safeUniverse >> 8) & 0xff;
  packet[16] = (evenLength >> 8) & 0xff;
  packet[17] = evenLength & 0xff;

  for (let index = 0; index < evenLength; index += 1) {
    packet[18 + index] = Math.max(0, Math.min(255, Math.round(frame[index] ?? 0)));
  }

  return packet;
};

export class ArtNetOutputDriver implements LightingOutputDriver {
  readonly metadata = {
    kind: 'artnet' as const,
    name: 'Art-Net output driver',
  };

  constructor(
    private readonly config: ArtNetDriverConfig,
    private readonly dependencies: ArtNetDriverDependencies,
  ) {}

  async connect(): Promise<void> {
    // UDP transport can lazily send without explicit handshake.
  }

  async disconnect(): Promise<void> {
    // Stateless transport, nothing to tear down.
  }

  async sendUniverse(universe: number, frame: UniverseFrame): Promise<void> {
    const packet = buildArtNetPacket(universe, frame);
    await this.dependencies.transport.send(
      packet,
      this.config.port ?? DEFAULT_ARTNET_PORT,
      this.config.host,
    );
  }

  async sendUniverses(universes: Readonly<Record<number, UniverseFrame>>): Promise<void> {
    const universesAsEntries = Object.entries(universes);
    for (const [universeAsString, frame] of universesAsEntries) {
      await this.sendUniverse(Number(universeAsString), frame);
    }
  }
}
