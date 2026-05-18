import type { AdapterFrameContext, AdapterHealth, RuntimeAdapter } from './types';

export class UsbDmxAdapter implements RuntimeAdapter {
  readonly family = 'usb-dmx' as const;
  private connected = false;

  constructor(
    readonly id: string,
    readonly description = 'USB DMX adapter (Enttec-like)',
  ) {}

  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }

  async sendFrame(universe: number, frame: ReadonlyArray<number>, context: AdapterFrameContext): Promise<void> {
    void universe;
    void frame;
    void context;
    if (!this.connected) throw new Error('USB DMX adapter not connected');
  }

  getHealth(): AdapterHealth { return { connected: this.connected }; }
}
