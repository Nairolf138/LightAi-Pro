import { app, safeStorage } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

type VaultContent = {
  version: 1;
  secrets: Record<string, string>;
};

const vaultPath = (): string => join(app.getPath('userData'), 'security', 'vault.enc.json');

function readVault(): VaultContent {
  const path = vaultPath();

  try {
    const content = readFileSync(path, 'utf8');
    const parsed = JSON.parse(content) as VaultContent;
    if (parsed.version !== 1 || typeof parsed.secrets !== 'object' || parsed.secrets === null) {
      throw new Error('Invalid vault format.');
    }
    return parsed;
  } catch {
    return { version: 1, secrets: {} };
  }
}

function writeVault(vault: VaultContent): void {
  const path = vaultPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(vault, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function assertStorageAvailable(): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure local vault unavailable: OS keychain is not accessible.');
  }
}

export function vaultSetSecret(vaultKey: string, plainValue: string): void {
  assertStorageAvailable();
  const vault = readVault();
  vault.secrets[vaultKey] = safeStorage.encryptString(plainValue).toString('base64');
  writeVault(vault);
}

export function vaultGetSecret(vaultKey: string): string | null {
  assertStorageAvailable();
  const vault = readVault();
  const encryptedValue = vault.secrets[vaultKey];
  if (!encryptedValue) {
    return null;
  }
  const decrypted = safeStorage.decryptString(Buffer.from(encryptedValue, 'base64'));
  return decrypted;
}

export function vaultDeleteSecret(vaultKey: string): void {
  const vault = readVault();
  if (!vault.secrets[vaultKey]) {
    return;
  }
  delete vault.secrets[vaultKey];
  writeVault(vault);
}
