import { app, BrowserWindow, dialog, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import { registerIpcHandlers } from './ipc/handlers';
import { HardwareRuntime } from './native/hardwareRuntime';
import { verifyRuntimeIntegrity } from './security/integrity';
import { checkProjectCompatibility, configureAutoUpdate } from './release/updatePolicy';

const runtime = new HardwareRuntime();


function maybeCheckProjectCompatibility(): void {
  const projectFormatVersion = Number(process.env.LIGHTAI_PROJECT_FORMAT_VERSION ?? 1);
  const compatibility = checkProjectCompatibility(projectFormatVersion);

  if (!compatibility.ok) {
    throw new Error(compatibility.reason ?? 'Project compatibility check failed.');
  }
}

function setupSecureAutoUpdates(): void {
  const channel = configureAutoUpdate();

  autoUpdater.on('error', (error) => {
    console.error('[auto-update] error', error);
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[auto-update] update available on channel ${channel}: ${info.version}`);
    void autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    console.log(`[auto-update] no update available on channel ${channel}`);
  });

  void autoUpdater.checkForUpdates();
}

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

  maybeCheckProjectCompatibility();
  installDesktopSecurityHeaders();
  registerIpcHandlers(runtime);
  createWindow();

  if (app.isPackaged) {
    setupSecureAutoUpdates();
  }

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
