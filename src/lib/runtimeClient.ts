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
import { DESKTOP_RUNTIME_UNAVAILABLE_MESSAGE, isDesktopRuntime } from './runtimeEnvironment';

export const runtimeFallbackStatus: Readonly<RuntimeStatus> = {
  contractVersion: EXPECTED_IPC_CONTRACT_VERSION,
  ready: false,
  connectedDeviceId: null,
  protocol: null,
  dryRun: true,
  deviceStatus: null,
  metrics: {
    protocolQueueDepth: 0,
    protocolQueueHighWatermark: 0,
    protocolDroppedFrames: 0
  }
};

export const cloneRuntimeStatus = (status: RuntimeStatus): RuntimeStatus => ({
  contractVersion: status.contractVersion,
  ready: status.ready,
  connectedDeviceId: status.connectedDeviceId,
  protocol: status.protocol,
  dryRun: status.dryRun,
  deviceStatus: status.deviceStatus
    ? {
        ...status.deviceStatus,
        recentErrors: [...status.deviceStatus.recentErrors],
        reconnect: { ...status.deviceStatus.reconnect },
        circuitBreaker: { ...status.deviceStatus.circuitBreaker }
      }
    : null,
  metrics: { ...status.metrics }
});

export const createRuntimeFallbackStatus = (): RuntimeStatus => cloneRuntimeStatus(runtimeFallbackStatus);

const unavailableError = DESKTOP_RUNTIME_UNAVAILABLE_MESSAGE;
const unavailableRuntimeTags = ['runtime', 'degraded'] as const;
const runtimeIpcTags = ['runtime', 'ipc'] as const;
let loggedWebRuntimeFallback = false;
const incompatibleRuntimeErrorPrefix = 'Incompatible native runtime contract';

function getNativeApi(): NativeIpcApi {
  if (!isDesktopRuntime || !window.lightAiNative) {
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
    if (!isDesktopRuntime || !window.lightAiNative) {
      if (!loggedWebRuntimeFallback) {
        observability.info(
          'runtimeClient',
          'Native runtime unavailable in browser/dev mode, returning fallback status',
          undefined,
          [...unavailableRuntimeTags],
        );
        loggedWebRuntimeFallback = true;
      }
      return { ...createRuntimeFallbackStatus(), compatible: true };
    }

    try {
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
    } catch (error) {
      observability.error(
        'runtimeClient',
        'Native runtime status IPC failed',
        { reason: error instanceof Error ? error.message : String(error) },
        'sev2',
        [...runtimeIpcTags],
      );
      throw error;
    }
  },
  vaultSetSecret: async (request: VaultSecretRequest): Promise<void> => getNativeApi().vaultSetSecret(request),
  vaultGetSecret: async (request: VaultSecretKeyRequest): Promise<string | null> =>
    getNativeApi().vaultGetSecret(request),
  vaultDeleteSecret: async (request: VaultSecretKeyRequest): Promise<void> =>
    getNativeApi().vaultDeleteSecret(request)
};
