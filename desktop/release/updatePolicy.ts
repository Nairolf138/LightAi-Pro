import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { autoUpdater } from 'electron-updater';

const VALID_CHANNELS = new Set(['stable', 'beta']);
const DEFAULT_CHANNEL = 'stable';
const COMPAT_PATH = resolve(process.cwd(), 'desktop/release/project-compatibility.json');

export type ReleaseChannel = 'stable' | 'beta';

type CompatPolicy = {
  projectVersion: {
    min: number;
    max: number;
  };
};

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

export function checkProjectCompatibility(appVersion: string, projectFormatVersion: number): { ok: boolean; reason?: string } {
  const major = String(Number.parseInt(appVersion.replace(/^v/i, '').split('.')[0] ?? '', 10));
  if (!major || major === 'NaN') {
    return { ok: false, reason: `Version applicative invalide: ${appVersion}.` };
  }

  const matrix = JSON.parse(readFileSync(COMPAT_PATH, 'utf8')) as Record<string, CompatPolicy>;
  const policy = matrix[major];
  if (!policy) {
    return { ok: false, reason: `Aucune politique de compatibilité pour la version majeure ${major}.` };
  }

  const { min, max } = policy.projectVersion;
  if (projectFormatVersion < min || projectFormatVersion > max) {
    return {
      ok: false,
      reason: `Version de projet ${projectFormatVersion} non supportée (support: ${min}-${max}).`
    };
  }

  return { ok: true };
}
