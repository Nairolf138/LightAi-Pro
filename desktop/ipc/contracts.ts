export const ipcChannels = {
  listDevices: 'runtime:list-devices',
  connectDevice: 'runtime:connect-device',
  disconnectDevice: 'runtime:disconnect-device',
  sendFrame: 'runtime:send-frame',
  runtimeStatus: 'runtime:status',
  vaultSetSecret: 'security:vault:set-secret',
  vaultGetSecret: 'security:vault:get-secret',
  vaultDeleteSecret: 'security:vault:delete-secret'
} as const;

export const IPC_CONTRACT_VERSION = '1.1.0' as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];

export type DeviceProtocol = 'dmx' | 'artnet' | 'osc';

export type HardwareDevice = {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  online: boolean;
};

export type RuntimeMetrics = {
  protocolQueueDepth: number;
  protocolQueueHighWatermark: number;
  protocolDroppedFrames: number;
};

export type DeviceRuntimeStatus = {
  deviceId: string;
  latencyMs: number | null;
  recentErrors: string[];
  reconnect: {
    active: boolean;
    attempts: number;
    nextRetryAt: number | null;
    backoffMs: number;
  };
  circuitBreaker: {
    open: boolean;
    openUntil: number | null;
  };
};

export type RuntimeStatus = {
  contractVersion: string;
  ready: boolean;
  connectedDeviceId: string | null;
  protocol: DeviceProtocol | null;
  dryRun: boolean;
  deviceStatus: DeviceRuntimeStatus | null;
  metrics: RuntimeMetrics;
};

export type RuntimeStatusHandshake = RuntimeStatus & {
  compatible: true;
};

export type ConnectDeviceRequest = {
  deviceId: string;
};

export type SendFrameRequest = {
  universe: number;
  channelValues: number[];
};

export type VaultSecretRequest = {
  key: string;
  value: string;
};

export type VaultSecretKeyRequest = {
  key: string;
};

export type NativeIpcApi = {
  listDevices: () => Promise<HardwareDevice[]>;
  connectDevice: (request: ConnectDeviceRequest) => Promise<RuntimeStatus>;
  disconnectDevice: () => Promise<RuntimeStatus>;
  sendFrame: (request: SendFrameRequest) => Promise<void>;
  getRuntimeStatus: () => Promise<RuntimeStatusHandshake>;
  vaultSetSecret: (request: VaultSecretRequest) => Promise<void>;
  vaultGetSecret: (request: VaultSecretKeyRequest) => Promise<string | null>;
  vaultDeleteSecret: (request: VaultSecretKeyRequest) => Promise<void>;
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

export function assertVaultSecretRequest(value: unknown): asserts value is VaultSecretRequest {
  if (!isRecord(value) || typeof value.key !== 'string' || value.key.length === 0 || typeof value.value !== 'string') {
    throw new Error('Invalid vault payload.');
  }
}

export function assertVaultSecretKeyRequest(value: unknown): asserts value is VaultSecretKeyRequest {
  if (!isRecord(value) || typeof value.key !== 'string' || value.key.length === 0) {
    throw new Error('Invalid vault key payload.');
  }
}

export function assertRuntimeStatus(value: unknown): asserts value is RuntimeStatus {
  if (!isRecord(value)) {
    throw new Error('Invalid runtime status payload: expected object.');
  }
  if (typeof value.contractVersion !== 'string' || value.contractVersion.length === 0) {
    throw new Error('Invalid runtime status payload: missing contractVersion.');
  }
  if (typeof value.ready !== 'boolean') {
    throw new Error('Invalid runtime status payload: missing ready flag.');
  }
  if (!(typeof value.connectedDeviceId === 'string' || value.connectedDeviceId === null)) {
    throw new Error('Invalid runtime status payload: invalid connectedDeviceId.');
  }
  if (!(value.protocol === 'dmx' || value.protocol === 'artnet' || value.protocol === 'osc' || value.protocol === null)) {
    throw new Error('Invalid runtime status payload: invalid protocol.');
  }
  if (typeof value.dryRun !== 'boolean') {
    throw new Error('Invalid runtime status payload: missing dryRun flag.');
  }
  if (!isRecord(value.metrics)) {
    throw new Error('Invalid runtime status payload: missing metrics.');
  }
  for (const key of ['protocolQueueDepth', 'protocolQueueHighWatermark', 'protocolDroppedFrames'] as const) {
    if (!Number.isFinite(value.metrics[key])) {
      throw new Error(`Invalid runtime status payload: metrics.${key} must be a number.`);
    }
  }
}
