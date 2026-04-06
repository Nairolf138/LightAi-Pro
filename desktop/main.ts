import { app, BrowserWindow, dialog, session } from 'electron';
import { registerIpcHandlers } from './ipc/handlers';
import { HardwareRuntime } from './native/hardwareRuntime';
import { verifyRuntimeIntegrity } from './security/integrity';

const runtime = new HardwareRuntime();

function installDesktopSecurityHeaders(): void {
  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:5173 ws://localhost:5173",
    "form-action 'self'"
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspDirectives],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY']
      }
    });
  });
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: new URL('./preload.ts', import.meta.url).pathname,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  const rendererUrl = process.env.LIGHTAI_UI_URL ?? 'http://localhost:5173';
  void mainWindow.loadURL(rendererUrl);
}

app.whenReady().then(async () => {
  const integrity = verifyRuntimeIntegrity();
  if (!integrity.ok) {
    await dialog.showErrorBox('Startup blocked by security policy', integrity.reason ?? 'Integrity verification failed.');
    app.quit();
    return;
  }

  installDesktopSecurityHeaders();
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
