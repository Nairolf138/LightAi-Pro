import { ipcMain } from 'electron';
import {
  assertConnectDeviceRequest,
  assertSendFrameRequest,
  assertVaultSecretKeyRequest,
  assertVaultSecretRequest,
  ipcChannels
} from './contracts.js';
import type { HardwareRuntime } from '../native/hardwareRuntime.js';
import { vaultDeleteSecret, vaultGetSecret, vaultSetSecret } from '../security/secretVault.js';

export function registerIpcHandlers(runtime: HardwareRuntime): void {
  ipcMain.handle(ipcChannels.listDevices, () => runtime.listDevices());

  ipcMain.handle(ipcChannels.connectDevice, (_event, payload: unknown) => {
    assertConnectDeviceRequest(payload);
    return runtime.connectDevice(payload);
  });

  ipcMain.handle(ipcChannels.disconnectDevice, () => runtime.disconnectDevice());

  ipcMain.handle(ipcChannels.sendFrame, (_event, payload: unknown) => {
    assertSendFrameRequest(payload);
    runtime.sendFrame(payload);
  });

  ipcMain.handle(ipcChannels.runtimeStatus, () => runtime.getStatus());

  ipcMain.handle(ipcChannels.vaultSetSecret, (_event, payload: unknown) => {
    assertVaultSecretRequest(payload);
    vaultSetSecret(payload.key, payload.value);
  });

  ipcMain.handle(ipcChannels.vaultGetSecret, (_event, payload: unknown) => {
    assertVaultSecretKeyRequest(payload);
    return vaultGetSecret(payload.key);
  });

  ipcMain.handle(ipcChannels.vaultDeleteSecret, (_event, payload: unknown) => {
    assertVaultSecretKeyRequest(payload);
    vaultDeleteSecret(payload.key);
  });
}
