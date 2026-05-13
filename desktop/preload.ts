import { contextBridge, ipcRenderer } from 'electron';
import { ipcChannels } from './ipc/contracts.js';
import type { NativeIpcApi } from './ipc/contracts.js';

const api: NativeIpcApi = {
  listDevices: () => ipcRenderer.invoke(ipcChannels.listDevices),
  connectDevice: (request) => ipcRenderer.invoke(ipcChannels.connectDevice, request),
  disconnectDevice: () => ipcRenderer.invoke(ipcChannels.disconnectDevice),
  sendFrame: (request) => ipcRenderer.invoke(ipcChannels.sendFrame, request),
  getRuntimeStatus: () => ipcRenderer.invoke(ipcChannels.runtimeStatus),
  vaultSetSecret: (request) => ipcRenderer.invoke(ipcChannels.vaultSetSecret, request),
  vaultGetSecret: (request) => ipcRenderer.invoke(ipcChannels.vaultGetSecret, request),
  vaultDeleteSecret: (request) => ipcRenderer.invoke(ipcChannels.vaultDeleteSecret, request)
};

contextBridge.exposeInMainWorld('lightAiNative', api);
