/// <reference types="vite/client" />

import type { NativeIpcApi } from '../desktop/ipc/contracts';

declare global {
  interface Window {
    lightAiNative?: NativeIpcApi;
  }
}
