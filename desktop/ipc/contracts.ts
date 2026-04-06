export const ipcChannels = {
  listDevices: 'runtime:list-devices',
  connectDevice: 'runtime:connect-device',
  disconnectDevice: 'runtime:disconnect-device',
  sendFrame: 'runtime:send-frame',
  runtimeStatus: 'runtime:status'
} as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];

export type DeviceProtocol = 'dmx' | 'artnet' | 'osc';

export type HardwareDevice = {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  online: boolean;
};

export type RuntimeStatus = {
  ready: boolean;
  connectedDeviceId: string | null;
  protocol: DeviceProtocol | null;
};

export type ConnectDeviceRequest = {
  deviceId: string;
};

export type SendFrameRequest = {
  universe: number;
  channelValues: number[];
};

export type NativeIpcApi = {
  listDevices: () => Promise<HardwareDevice[]>;
  connectDevice: (request: ConnectDeviceRequest) => Promise<RuntimeStatus>;
  disconnectDevice: () => Promise<RuntimeStatus>;
  sendFrame: (request: SendFrameRequest) => Promise<void>;
  getRuntimeStatus: () => Promise<RuntimeStatus>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function assertConnectDeviceRequest(value: unknown): asserts value is ConnectDeviceRequest {
  if (!isRecord(value) || typeof value.deviceId !== 'string' || value.deviceId.length === 0) {
    throw new Error('Invalid connect device payload.');
  }
}

export function assertSendFrameRequest(value: unknown): asserts value is SendFrameRequest {
  if (!isRecord(value) || typeof value.universe !== 'number' || !Number.isInteger(value.universe) || value.universe < 0) {
    throw new Error('Invalid frame payload: universe must be a positive integer.');
  }

  if (!Array.isArray(value.channelValues) || value.channelValues.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) {
    throw new Error('Invalid frame payload: channelValues must be an array of DMX bytes (0-255).');
  }
}
