import type { AdapterFrameContext, AdapterHealth, RuntimeAdapter } from './types';

export interface DryRunEvent {
  universe: number;
  frame: ReadonlyArray<number>;
  context: AdapterFrameContext;
}

export class DryRunSimulatorAdapter implements RuntimeAdapter {
  readonly family = 'osc' as const;
  readonly description = 'Dry-run simulator (no hardware write)';
  private connected = false;
  readonly events: DryRunEvent[] = [];

  constructor(readonly id = 'dry-run-simulator') {}

  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }

  async sendFrame(universe: number, frame: ReadonlyArray<number>, context: AdapterFrameContext): Promise<void> {
    if (!this.connected) throw new Error('Dry-run simulator not connected');
    this.events.push({ universe, frame: [...frame], context });
  }

  getHealth(): AdapterHealth { return { connected: this.connected, queueDepth: this.events.length }; }
}
