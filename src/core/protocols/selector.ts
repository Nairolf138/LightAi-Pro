import type { ShowState, Universe } from '../lighting-engine/types';
import { ArtNetOutputDriver, type ArtNetDriverDependencies } from './drivers/artnet';
import { DmxUsbOutputDriver, type DmxDriverDependencies } from './drivers/dmx';
import { OscOutputDriver, type OscDriverDependencies } from './drivers/osc';
import {
  SimulatorOutputDriver,
  type SimulatorDriverDependencies,
} from './drivers/simulator';
import {
  defaultShowOutputConfig,
  type DriverKind,
  type LightingOutputDriver,
  type ShowOutputConfig,
  type UniverseFrame,
} from './types';

export interface LightingDriverFactoryDependencies {
  artnet?: ArtNetDriverDependencies;
  dmx?: DmxDriverDependencies;
  osc?: OscDriverDependencies;
  simulator?: SimulatorDriverDependencies;
}

const getConfigForDriver = (config: ShowOutputConfig, kind: DriverKind) => {
  switch (kind) {
    case 'artnet':
      return config.artnet;
    case 'dmx':
      return config.dmx;
    case 'osc':
      return config.osc;
    case 'simulator':
      return config.simulator;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
};

const universeToFrame = (universe: Universe): UniverseFrame => {
  const frame: number[] = [];
  for (let channel = 1; channel <= universe.size; channel += 1) {
    frame.push(universe.channels[channel] ?? 0);
  }
  return frame;
};

export const showStateToUniverseFrames = (
  showState: Pick<ShowState, 'universes'>,
): Readonly<Record<number, UniverseFrame>> => {
  const frames: Record<number, UniverseFrame> = {};

  for (const [universeId, universe] of Object.entries(showState.universes)) {
    const universeIndex = Number(universeId) || 0;
    frames[universeIndex] = universeToFrame(universe);
  }

  return frames;
};

export const createLightingOutputDriver = (
  config: ShowOutputConfig,
  dependencies: LightingDriverFactoryDependencies = {},
): LightingOutputDriver => {
  const { activeDriver } = config;

  switch (activeDriver) {
    case 'artnet': {
      if (!config.artnet) {
        throw new Error('Art-Net driver selected but not configured');
      }
      if (!dependencies.artnet) {
        throw new Error('Art-Net dependencies are required to create the driver');
      }
      return new ArtNetOutputDriver(config.artnet, dependencies.artnet);
    }
    case 'dmx': {
      if (!config.dmx) {
        throw new Error('DMX driver selected but not configured');
      }
      if (!dependencies.dmx) {
        throw new Error('DMX dependencies are required to create the driver');
      }
      return new DmxUsbOutputDriver(config.dmx, dependencies.dmx);
    }
    case 'osc': {
      if (!config.osc) {
        throw new Error('OSC driver selected but not configured');
      }
      if (!dependencies.osc) {
        throw new Error('OSC dependencies are required to create the driver');
      }
      return new OscOutputDriver(config.osc, dependencies.osc);
    }
    case 'simulator': {
      return new SimulatorOutputDriver(
        config.simulator ?? defaultShowOutputConfig.simulator ?? { kind: 'simulator' },
        dependencies.simulator,
      );
    }
    default: {
      const exhaustive: never = activeDriver;
      return exhaustive;
    }
  }
};

export class LightingOutputRouter {
  private driver: LightingOutputDriver | null = null;

  constructor(private readonly dependencies: LightingDriverFactoryDependencies = {}) {}

  async setConfiguration(config: ShowOutputConfig): Promise<void> {
    if (this.driver) {
      await this.driver.disconnect();
    }

    this.driver = createLightingOutputDriver(config, this.dependencies);
    await this.driver.connect();
  }

  async applyState(showState: ShowState): Promise<void> {
    if (!this.driver) {
      const config = showState.output ?? defaultShowOutputConfig;
      await this.setConfiguration(config);
    }

    const frames = showStateToUniverseFrames(showState);
    await this.driver?.sendUniverses(frames);
  }

  getActiveDriver(): LightingOutputDriver | null {
    return this.driver;
  }
}

export const resolveShowOutputConfig = (showState: Pick<ShowState, 'output'>): ShowOutputConfig =>
  showState.output ?? defaultShowOutputConfig;

export const getActiveDriverConfiguration = (config: ShowOutputConfig) =>
  getConfigForDriver(config, config.activeDriver);
