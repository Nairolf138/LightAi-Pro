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

  async sendFrame(_universe: number, _frame: ReadonlyArray<number>, _context: AdapterFrameContext): Promise<void> {
    if (!this.connected) throw new Error('Art-Net node adapter not connected');
  }

  getHealth(): AdapterHealth { return { connected: this.connected }; }
}
