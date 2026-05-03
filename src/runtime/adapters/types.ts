export type AdapterFamily = 'usb-dmx' | 'art-net' | 'sacn' | 'osc';

export interface AdapterHealth {
  readonly connected: boolean;
  readonly lastError?: string;
  readonly queueDepth?: number;
}

export interface AdapterFrameContext {
  readonly timestampMs: number;
  readonly criticalUniverses?: ReadonlyArray<number>;
  readonly criticalChannelsByUniverse?: Readonly<Record<number, ReadonlyArray<number>>>;
}

export interface RuntimeAdapter {
  readonly id: string;
  readonly family: AdapterFamily;
  readonly description: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendFrame(universe: number, frame: ReadonlyArray<number>, context: AdapterFrameContext): Promise<void>;
  getHealth(): AdapterHealth;
}

export interface AdapterPriorityPolicy {
  readonly protocolOrder: ReadonlyArray<'sacn' | 'osc'>;
}

export const defaultPriorityPolicy: AdapterPriorityPolicy = {
  protocolOrder: ['sacn', 'osc'],
};
