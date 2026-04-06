import type {
  ConnectDeviceRequest,
  HardwareDevice,
  NativeIpcApi,
  RuntimeStatus,
  SendFrameRequest,
  VaultSecretKeyRequest,
  VaultSecretRequest
} from '../../desktop/ipc/contracts';

const fallbackStatus: RuntimeStatus = {
  ready: false,
  connectedDeviceId: null,
  protocol: null,
  metrics: {
    protocolQueueDepth: 0,
    protocolQueueHighWatermark: 0,
    protocolDroppedFrames: 0
  }
};

const unavailableError =
  'Native runtime unavailable. Start the desktop shell to access hardware protocols.';

function getNativeApi(): NativeIpcApi {
  if (!window.lightAiNative) {
    throw new Error(unavailableError);
  }
  return window.lightAiNative;
}

export const runtimeClient = {
  listDevices: async (): Promise<HardwareDevice[]> => getNativeApi().listDevices(),
  connectDevice: async (request: ConnectDeviceRequest): Promise<RuntimeStatus> =>
    getNativeApi().connectDevice(request),
  disconnectDevice: async (): Promise<RuntimeStatus> => getNativeApi().disconnectDevice(),
  sendFrame: async (request: SendFrameRequest): Promise<void> => getNativeApi().sendFrame(request),
  getRuntimeStatus: async (): Promise<RuntimeStatus> => {
    if (!window.lightAiNative) {
      return fallbackStatus;
    }
    return window.lightAiNative.getRuntimeStatus();
  },
  vaultSetSecret: async (request: VaultSecretRequest): Promise<void> => getNativeApi().vaultSetSecret(request),
  vaultGetSecret: async (request: VaultSecretKeyRequest): Promise<string | null> =>
    getNativeApi().vaultGetSecret(request),
  vaultDeleteSecret: async (request: VaultSecretKeyRequest): Promise<void> =>
    getNativeApi().vaultDeleteSecret(request)
};
