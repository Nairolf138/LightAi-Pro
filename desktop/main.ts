import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc/handlers';
import { HardwareRuntime } from './native/hardwareRuntime';

const runtime = new HardwareRuntime();

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: new URL('./preload.ts', import.meta.url).pathname,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const rendererUrl = process.env.LIGHTAI_UI_URL ?? 'http://localhost:5173';
  void mainWindow.loadURL(rendererUrl);
}

app.whenReady().then(() => {
  registerIpcHandlers(runtime);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
