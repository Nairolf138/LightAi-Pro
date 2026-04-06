import { ipcMain } from 'electron';
import {
  assertConnectDeviceRequest,
  assertSendFrameRequest,
  ipcChannels
} from './contracts';
import type { HardwareRuntime } from '../native/hardwareRuntime';

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
}
