import type { ConnectDeviceRequest, HardwareDevice, RuntimeStatus, SendFrameRequest } from '../ipc/contracts';
import {
  ArtnetAdapter,
  DmxUsbAdapter,
  DryRunAdapter,
  OscAdapter,
  type HardwareAdapter,
  type HardwareAdapterHealth,
  type ReconnectState
} from './hardwareAdapters';

const mockDevices: HardwareDevice[] = [
  { id: 'dmx-usb-001', name: 'USB DMX Interface', protocol: 'dmx', online: true },
  { id: 'artnet-node-01', name: 'Art-Net Node #1', protocol: 'artnet', online: true },
  { id: 'osc-bridge-01', name: 'OSC Bridge', protocol: 'osc', online: true }
];

const MAX_PROTOCOL_QUEUE_DEPTH = 120;

type RuntimeOptions = {
  dryRun?: boolean;
};

type DeviceRuntimeState = {
  reconnect: ReconnectState;
  circuitOpenUntil: number | null;
  recentErrors: string[];
};

const MAX_RECENT_ERRORS = 5;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 10_000;

export class HardwareRuntime {
  private protocolQueueDepth = 0;
  private protocolQueueHighWatermark = 0;
  private protocolDroppedFrames = 0;
  private readonly dryRun: boolean;
  private currentAdapter: HardwareAdapter | null = null;
  private readonly deviceStates = new Map<string, DeviceRuntimeState>();

  private status: RuntimeStatus = {
    ready: true,
    connectedDeviceId: null,
    protocol: null,
    dryRun: false,
    deviceStatus: null,
    metrics: {
      protocolQueueDepth: 0,
      protocolQueueHighWatermark: 0,
      protocolDroppedFrames: 0
    }
  };

  constructor(options: RuntimeOptions = {}) {
    this.dryRun = options.dryRun ?? process.env.LIGHTAI_HARDWARE_DRY_RUN === 'true';
    this.status.dryRun = this.dryRun;
  }

  listDevices(): HardwareDevice[] {
    return mockDevices;
  }

  connectDevice(request: ConnectDeviceRequest): RuntimeStatus {
    const device = mockDevices.find((d) => d.id === request.deviceId);
    if (!device) throw new Error(`Unknown device: ${request.deviceId}`);

    this.currentAdapter = this.createAdapter(device.protocol);
    const state = this.getDeviceState(device.id);

    this.withCircuitBreaker(device.id, () => this.currentAdapter?.connect(device.id));

    this.status = {
      ...this.status,
      ready: true,
      connectedDeviceId: device.id,
      protocol: device.protocol,
      deviceStatus: this.buildDeviceStatus(device.id),
      metrics: this.readMetrics()
    };

    state.reconnect = { ...state.reconnect, active: false };
    return this.status;
  }

  disconnectDevice(): RuntimeStatus {
    if (this.currentAdapter && this.status.connectedDeviceId) {
      this.currentAdapter.disconnect(this.status.connectedDeviceId);
    }
    this.currentAdapter = null;
    this.status = {
      ...this.status,
      connectedDeviceId: null,
      protocol: null,
      deviceStatus: null,
      metrics: this.readMetrics()
    };
    return this.status;
  }

  sendFrame(request: SendFrameRequest): void {
    if (!this.status.connectedDeviceId || !this.currentAdapter) throw new Error('No hardware device connected.');
    void request;

    if (this.protocolQueueDepth >= MAX_PROTOCOL_QUEUE_DEPTH) {
      this.protocolDroppedFrames += 1;
      this.status = { ...this.status, metrics: this.readMetrics(), deviceStatus: this.buildDeviceStatus(this.status.connectedDeviceId) };
      return;
    }

    this.protocolQueueDepth += 1;
    this.protocolQueueHighWatermark = Math.max(this.protocolQueueHighWatermark, this.protocolQueueDepth);

    try {
      this.withCircuitBreaker(this.status.connectedDeviceId, () => this.currentAdapter?.sendFrame(request));
    } catch (error) {
      this.recordError(this.status.connectedDeviceId, error);
      this.triggerReconnect(this.status.connectedDeviceId);
      throw error;
    } finally {
      setTimeout(() => {
        this.protocolQueueDepth = Math.max(0, this.protocolQueueDepth - 1);
        this.status = {
          ...this.status,
          metrics: this.readMetrics(),
          deviceStatus: this.status.connectedDeviceId ? this.buildDeviceStatus(this.status.connectedDeviceId) : null
        };
      }, 8);

      this.status = {
        ...this.status,
        metrics: this.readMetrics(),
        deviceStatus: this.buildDeviceStatus(this.status.connectedDeviceId)
      };
    }
  }

  getStatus(): RuntimeStatus {
    return {
      ...this.status,
      deviceStatus: this.status.connectedDeviceId ? this.buildDeviceStatus(this.status.connectedDeviceId) : null,
      metrics: this.readMetrics()
    };
  }

  private createAdapter(protocol: HardwareDevice['protocol']): HardwareAdapter {
    if (this.dryRun) return new DryRunAdapter(protocol);
    switch (protocol) {
      case 'dmx': return new DmxUsbAdapter();
      case 'artnet': return new ArtnetAdapter();
      case 'osc': return new OscAdapter();
    }
  }

  private getDeviceState(deviceId: string): DeviceRuntimeState {
    const existing = this.deviceStates.get(deviceId);
    if (existing) return existing;
    const created: DeviceRuntimeState = {
      reconnect: { active: false, attempts: 0, nextRetryAt: null, backoffMs: 0 },
      circuitOpenUntil: null,
      recentErrors: []
    };
    this.deviceStates.set(deviceId, created);
    return created;
  }

  private withCircuitBreaker(deviceId: string, operation: () => void): void {
    const state = this.getDeviceState(deviceId);
    if (state.circuitOpenUntil && Date.now() < state.circuitOpenUntil) {
      throw new Error(`Circuit breaker open for ${deviceId}`);
    }

    try {
      operation();
    } catch (error) {
      if (state.recentErrors.length >= CIRCUIT_BREAKER_THRESHOLD - 1) {
        state.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
      }
      throw error;
    }
  }

  private triggerReconnect(deviceId: string): void {
    const state = this.getDeviceState(deviceId);
    if (state.reconnect.active) return;

    state.reconnect.active = true;
    state.reconnect.attempts += 1;
    state.reconnect.backoffMs = Math.min(500 * 2 ** (state.reconnect.attempts - 1), 10_000);
    state.reconnect.nextRetryAt = Date.now() + state.reconnect.backoffMs;

    setTimeout(() => {
      try {
        this.currentAdapter?.connect(deviceId);
        state.reconnect = { active: false, attempts: 0, nextRetryAt: null, backoffMs: 0 };
      } catch (error) {
        this.recordError(deviceId, error);
        state.reconnect.active = false;
        this.triggerReconnect(deviceId);
      }
    }, state.reconnect.backoffMs);
  }

  private recordError(deviceId: string, error: unknown): void {
    const state = this.getDeviceState(deviceId);
    const msg = error instanceof Error ? error.message : 'Unknown transport error';
    state.recentErrors = [...state.recentErrors.slice(-(MAX_RECENT_ERRORS - 1)), msg];
  }

  private buildDeviceStatus(deviceId: string) {
    const state = this.getDeviceState(deviceId);
    const health = this.currentAdapter?.health(deviceId) as HardwareAdapterHealth | undefined;
    return {
      deviceId,
      latencyMs: health?.latencyMs ?? null,
      recentErrors: state.recentErrors,
      reconnect: state.reconnect,
      circuitBreaker: {
        open: Boolean(state.circuitOpenUntil && Date.now() < state.circuitOpenUntil),
        openUntil: state.circuitOpenUntil
      }
    };
  }

  private readMetrics() {
    return {
      protocolQueueDepth: this.protocolQueueDepth,
      protocolQueueHighWatermark: this.protocolQueueHighWatermark,
      protocolDroppedFrames: this.protocolDroppedFrames
    };
  }
}
