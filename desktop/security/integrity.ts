import { app } from 'electron';
import { createHash, createVerify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type IntegrityMetadata = {
  algorithm: 'sha256';
  targetPath: string;
  digestHex: string;
  signatureBase64: string;
  signedAt: string;
};

function resolvePublicKey(): string {
  const inlineKey = process.env.LIGHTAI_BUILD_PUBLIC_KEY;
  if (inlineKey?.includes('BEGIN PUBLIC KEY')) {
    return inlineKey;
  }

  const keyPath = process.env.LIGHTAI_BUILD_PUBLIC_KEY_PATH;
  if (!keyPath || !existsSync(keyPath)) {
    throw new Error('Public key missing: set LIGHTAI_BUILD_PUBLIC_KEY or LIGHTAI_BUILD_PUBLIC_KEY_PATH.');
  }

  return readFileSync(keyPath, 'utf8');
}

function resolveIntegrityMetadataPath(): string {
  const explicit = process.env.LIGHTAI_INTEGRITY_FILE;
  if (explicit) {
    return explicit;
  }

  if (app.isPackaged) {
    return join(process.resourcesPath, 'signature', 'build-integrity.json');
  }

  return join(process.cwd(), 'desktop', 'signature', 'build-integrity.json');
}

function shouldEnforceIntegrity(): boolean {
  if (process.env.LIGHTAI_ENFORCE_INTEGRITY === 'true') {
    return true;
  }
  return app.isPackaged;
}

export function verifyRuntimeIntegrity(): { ok: boolean; reason?: string } {
  if (!shouldEnforceIntegrity()) {
    return { ok: true };
  }

  try {
    const metadataPath = resolveIntegrityMetadataPath();
    if (!existsSync(metadataPath)) {
      return { ok: false, reason: `Integrity metadata missing: ${metadataPath}` };
    }

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as IntegrityMetadata;
    const normalizedTarget = app.isPackaged
      ? join(process.resourcesPath, metadata.targetPath)
      : join(process.cwd(), metadata.targetPath);

    if (!existsSync(normalizedTarget)) {
      return { ok: false, reason: `Signed target missing: ${normalizedTarget}` };
    }

    const payload = readFileSync(normalizedTarget);
    const digest = createHash('sha256').update(payload).digest('hex');
    if (digest !== metadata.digestHex) {
      return { ok: false, reason: 'Digest mismatch: binary tampering detected.' };
    }

    const verifier = createVerify('sha256');
    verifier.update(metadata.digestHex);
    verifier.end();

    const verified = verifier.verify(resolvePublicKey(), Buffer.from(metadata.signatureBase64, 'base64'));
    if (!verified) {
      return { ok: false, reason: 'Signature verification failed.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown integrity verification error.'
    };
  }
}
