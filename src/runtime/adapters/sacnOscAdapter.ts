import type { AdapterFrameContext, AdapterHealth, AdapterPriorityPolicy, RuntimeAdapter } from './types';

export class SacnOscAdapter implements RuntimeAdapter {
  readonly family = 'sacn' as const;
  private connected = false;
  private lastProtocol: 'sacn' | 'osc' | null = null;

  constructor(
    readonly id: string,
    private readonly policy: AdapterPriorityPolicy,
    readonly description = 'sACN/OSC prioritized adapter',
  ) {}

  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }

  async sendFrame(_universe: number, _frame: ReadonlyArray<number>, _context: AdapterFrameContext): Promise<void> {
    if (!this.connected) throw new Error('sACN/OSC adapter not connected');
    this.lastProtocol = this.policy.protocolOrder[0] ?? 'sacn';
  }

  getHealth(): AdapterHealth {
    return { connected: this.connected, lastError: this.lastProtocol ? undefined : 'No protocol selected yet' };
  }
}
