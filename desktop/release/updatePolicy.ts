import { autoUpdater } from 'electron-updater';

const VALID_CHANNELS = new Set(['stable', 'beta']);
const DEFAULT_CHANNEL = 'stable';

export type ReleaseChannel = 'stable' | 'beta';

export function resolveReleaseChannel(): ReleaseChannel {
  const rawChannel = (process.env.LIGHTAI_RELEASE_CHANNEL ?? DEFAULT_CHANNEL).toLowerCase();
  if (VALID_CHANNELS.has(rawChannel)) {
    return rawChannel as ReleaseChannel;
  }

  return DEFAULT_CHANNEL;
}

export function configureAutoUpdate(): ReleaseChannel {
  const channel = resolveReleaseChannel();

  autoUpdater.channel = channel;
  autoUpdater.allowPrerelease = channel === 'beta';
  autoUpdater.allowDowngrade = false;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  return channel;
}

export function checkProjectCompatibility(projectFormatVersion: number): { ok: boolean; reason?: string } {
  const minProjectVersion = Number(process.env.LIGHTAI_PROJECT_VERSION_MIN ?? 1);
  const maxProjectVersion = Number(process.env.LIGHTAI_PROJECT_VERSION_MAX ?? 2);

  if (projectFormatVersion < minProjectVersion || projectFormatVersion > maxProjectVersion) {
    return {
      ok: false,
      reason: `Version de projet ${projectFormatVersion} non supportée (support: ${minProjectVersion}-${maxProjectVersion}).`
    };
  }

  return { ok: true };
}
