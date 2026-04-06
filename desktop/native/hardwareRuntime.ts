import type { ConnectDeviceRequest, HardwareDevice, RuntimeStatus, SendFrameRequest } from '../ipc/contracts';

const mockDevices: HardwareDevice[] = [
  { id: 'dmx-usb-001', name: 'USB DMX Interface', protocol: 'dmx', online: true },
  { id: 'artnet-node-01', name: 'Art-Net Node #1', protocol: 'artnet', online: true },
  { id: 'osc-bridge-01', name: 'OSC Bridge', protocol: 'osc', online: true }
];

const MAX_PROTOCOL_QUEUE_DEPTH = 120;

export class HardwareRuntime {
  private protocolQueueDepth = 0;
  private protocolQueueHighWatermark = 0;
  private protocolDroppedFrames = 0;

  private status: RuntimeStatus = {
    ready: true,
    connectedDeviceId: null,
    protocol: null,
    metrics: {
      protocolQueueDepth: 0,
      protocolQueueHighWatermark: 0,
      protocolDroppedFrames: 0
    }
  };

  listDevices(): HardwareDevice[] {
    return mockDevices;
  }

  connectDevice(request: ConnectDeviceRequest): RuntimeStatus {
    const device = mockDevices.find((d) => d.id === request.deviceId);
    if (!device) {
      throw new Error(`Unknown device: ${request.deviceId}`);
    }

    this.status = {
      ready: true,
      connectedDeviceId: device.id,
      protocol: device.protocol,
      metrics: this.readMetrics()
    };

    return this.status;
  }

  disconnectDevice(): RuntimeStatus {
    this.status = {
      ...this.status,
      connectedDeviceId: null,
      protocol: null,
      metrics: this.readMetrics()
    };
    return this.status;
  }

  sendFrame(request: SendFrameRequest): void {
    if (!this.status.connectedDeviceId) {
      throw new Error('No hardware device connected.');
    }

    // NOTE: Protocol adapters (DMX/Art-Net/OSC) must remain in this native layer.
    void request;

    if (this.protocolQueueDepth >= MAX_PROTOCOL_QUEUE_DEPTH) {
      this.protocolDroppedFrames += 1;
      this.status = {
        ...this.status,
        metrics: this.readMetrics()
      };
      return;
    }

    this.protocolQueueDepth += 1;
    this.protocolQueueHighWatermark = Math.max(this.protocolQueueHighWatermark, this.protocolQueueDepth);

    setTimeout(() => {
      this.protocolQueueDepth = Math.max(0, this.protocolQueueDepth - 1);
      this.status = {
        ...this.status,
        metrics: this.readMetrics()
      };
    }, 8);

    this.status = {
      ...this.status,
      metrics: this.readMetrics()
    };
  }

  getStatus(): RuntimeStatus {
    return {
      ...this.status,
      metrics: this.readMetrics()
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
