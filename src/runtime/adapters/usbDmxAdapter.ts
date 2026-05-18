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

  async sendFrame(_universe: number, _frame: ReadonlyArray<number>, _context: AdapterFrameContext): Promise<void> {
    void _universe;
    void _frame;
    void _context;
    if (!this.connected) throw new Error('USB DMX adapter not connected');
  }

  getHealth(): AdapterHealth { return { connected: this.connected }; }
}
