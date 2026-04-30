import type {
  RuntimeStatusHandshake,
  ConnectDeviceRequest,
  HardwareDevice,
  NativeIpcApi,
  RuntimeStatus,
  SendFrameRequest,
  VaultSecretKeyRequest,
  VaultSecretRequest
} from '../../desktop/ipc/contracts';
import { assertRuntimeStatus as assertRuntimeStatusPayload, IPC_CONTRACT_VERSION as EXPECTED_IPC_CONTRACT_VERSION } from '../../desktop/ipc/contracts';
import { observability } from './observability';

const fallbackStatus: RuntimeStatus = {
  contractVersion: EXPECTED_IPC_CONTRACT_VERSION,
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
const incompatibleRuntimeErrorPrefix = 'Incompatible native runtime contract';

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
  sendFrame: async (request: SendFrameRequest): Promise<void> => {
    try {
      await getNativeApi().sendFrame(request);
    } catch (error) {
      observability.error('runtimeClient', 'Frame send failed', {
        request,
        error: error instanceof Error ? error.message : String(error),
      }, 'sev2', ['runtime', 'frame']);
      throw error;
    }
  },
  getRuntimeStatus: async (): Promise<RuntimeStatusHandshake> => {
    if (!window.lightAiNative) {
      observability.warn('runtimeClient', 'Native runtime unavailable, returning fallback status', undefined, [
        'runtime',
        'degraded',
      ]);
      return { ...fallbackStatus, compatible: true };
    }
    const status = await window.lightAiNative.getRuntimeStatus();
    assertRuntimeStatusPayload(status);
    if (status.contractVersion !== EXPECTED_IPC_CONTRACT_VERSION) {
      throw new Error(
        `${incompatibleRuntimeErrorPrefix}: operator action required. Renderer expects ${EXPECTED_IPC_CONTRACT_VERSION}, native runtime reports ${status.contractVersion}. Restart and redeploy both desktop shell and renderer with the same build.`,
      );
    }
    observability.setProtocolMetrics({
      queueDepth: status.metrics.protocolQueueDepth,
      queueHighWatermark: status.metrics.protocolQueueHighWatermark,
      droppedFrames: status.metrics.protocolDroppedFrames,
    });
    return { ...status, compatible: true };
  },
  vaultSetSecret: async (request: VaultSecretRequest): Promise<void> => getNativeApi().vaultSetSecret(request),
  vaultGetSecret: async (request: VaultSecretKeyRequest): Promise<string | null> =>
    getNativeApi().vaultGetSecret(request),
  vaultDeleteSecret: async (request: VaultSecretKeyRequest): Promise<void> =>
    getNativeApi().vaultDeleteSecret(request)
};
