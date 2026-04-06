import type { LightingOutputDriver, SimulatorDriverConfig, UniverseFrame } from '../../types';

export interface SimulatorFrameEvent {
  readonly universe: number;
  readonly frame: UniverseFrame;
  readonly atMs: number;
}

export interface SimulatorDriverDependencies {
  onFrame?: (event: SimulatorFrameEvent) => void;
  now?: () => number;
}

export class SimulatorOutputDriver implements LightingOutputDriver {
  readonly metadata = {
    kind: 'simulator' as const,
    name: 'Simulator output driver',
  };

  readonly history: SimulatorFrameEvent[] = [];

  private readonly now: () => number;

  constructor(
    private readonly config: SimulatorDriverConfig,
    private readonly dependencies: SimulatorDriverDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => Date.now());
  }

  async connect(): Promise<void> {
    // No-op; simulation starts immediately.
  }

  async disconnect(): Promise<void> {
    // No-op.
  }

  async sendUniverse(universe: number, frame: UniverseFrame): Promise<void> {
    const latency = Math.max(0, this.config.latencyMs ?? 0);
    if (latency > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, latency);
      });
    }

    const event: SimulatorFrameEvent = {
      universe,
      frame,
      atMs: this.now(),
    };

    this.history.push(event);

    if (this.config.logFrames) {
      console.debug('[simulator-driver]', event);
    }

    this.dependencies.onFrame?.(event);
  }

  async sendUniverses(universes: Readonly<Record<number, UniverseFrame>>): Promise<void> {
    const universesAsEntries = Object.entries(universes);
    for (const [universeAsString, frame] of universesAsEntries) {
      await this.sendUniverse(Number(universeAsString), frame);
    }
  }
}
