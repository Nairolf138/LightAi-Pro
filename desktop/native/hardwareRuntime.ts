import type { ConnectDeviceRequest, HardwareDevice, RuntimeStatus, SendFrameRequest } from '../ipc/contracts';

const mockDevices: HardwareDevice[] = [
  { id: 'dmx-usb-001', name: 'USB DMX Interface', protocol: 'dmx', online: true },
  { id: 'artnet-node-01', name: 'Art-Net Node #1', protocol: 'artnet', online: true },
  { id: 'osc-bridge-01', name: 'OSC Bridge', protocol: 'osc', online: true }
];

export class HardwareRuntime {
  private status: RuntimeStatus = {
    ready: true,
    connectedDeviceId: null,
    protocol: null
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
      protocol: device.protocol
    };

    return this.status;
  }

  disconnectDevice(): RuntimeStatus {
    this.status = {
      ...this.status,
      connectedDeviceId: null,
      protocol: null
    };
    return this.status;
  }

  sendFrame(request: SendFrameRequest): void {
    if (!this.status.connectedDeviceId) {
      throw new Error('No hardware device connected.');
    }

    // NOTE: Protocol adapters (DMX/Art-Net/OSC) must remain in this native layer.
    void request;
  }

  getStatus(): RuntimeStatus {
    return this.status;
  }
}
