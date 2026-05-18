import type { AdapterFrameContext, AdapterHealth, RuntimeAdapter } from './types';

export class ArtNetNodeAdapter implements RuntimeAdapter {
  readonly family = 'art-net' as const;
  private connected = false;

  constructor(
    readonly id: string,
    readonly description = 'Art-Net node adapter',
  ) {}

  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }

  async sendFrame(universe: number, frame: ReadonlyArray<number>, context: AdapterFrameContext): Promise<void> {
    void universe;
    void frame;
    void context;
    if (!this.connected) throw new Error('Art-Net node adapter not connected');
  }

  getHealth(): AdapterHealth { return { connected: this.connected }; }
}
