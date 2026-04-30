import type { DeviceProtocol, SendFrameRequest } from '../ipc/contracts';

export type HardwareAdapterHealth = {
  connected: boolean;
  latencyMs: number | null;
  lastError: string | null;
};

export type ReconnectState = {
  active: boolean;
  attempts: number;
  nextRetryAt: number | null;
  backoffMs: number;
};

export interface HardwareAdapter {
  connect(deviceId: string): void;
  disconnect(deviceId: string): void;
  sendFrame(frame: SendFrameRequest): void;
  health(deviceId: string): HardwareAdapterHealth;
}

abstract class BaseAdapter implements HardwareAdapter {
  protected connected = false;
  protected latencyMs: number | null = null;
  protected lastError: string | null = null;

  connect(deviceId: string): void {
    void deviceId;
    this.connected = true;
    this.lastError = null;
    this.latencyMs = Math.round(2 + Math.random() * 8);
  }

  disconnect(deviceId: string): void {
    void deviceId;
    this.connected = false;
  }

  sendFrame(frame: SendFrameRequest): void {
    void frame;
    if (!this.connected) {
      this.lastError = 'Transport not connected';
      throw new Error(this.lastError);
    }
  }

  health(deviceId: string): HardwareAdapterHealth {
    void deviceId;
    return { connected: this.connected, latencyMs: this.latencyMs, lastError: this.lastError };
  }
}

export class DmxUsbAdapter extends BaseAdapter {
  sendFrame(frame: SendFrameRequest): void {
    super.sendFrame(frame);
    if (frame.channelValues.length > 512) {
      this.lastError = 'DMX frame overflow (>512 channels)';
      throw new Error(this.lastError);
    }
  }
}

export class ArtnetAdapter extends BaseAdapter {
  sendFrame(frame: SendFrameRequest): void {
    super.sendFrame(frame);
    if (frame.universe > 32_767) {
      this.lastError = 'Art-Net universe out of range';
      throw new Error(this.lastError);
    }
  }
}

export class OscAdapter extends BaseAdapter {
  sendFrame(frame: SendFrameRequest): void {
    super.sendFrame(frame);
    if (frame.channelValues.length === 0) {
      this.lastError = 'OSC payload empty';
      throw new Error(this.lastError);
    }
  }
}

export class DryRunAdapter extends BaseAdapter {
  constructor(private readonly protocol: DeviceProtocol) {
    super();
  }

  override sendFrame(frame: SendFrameRequest): void {
    super.sendFrame(frame);
    void this.protocol;
    void frame;
  }
}
