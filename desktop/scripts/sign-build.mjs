import { createHash, createSign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const target = process.env.LIGHTAI_SIGN_TARGET ?? 'dist-desktop/app.asar';
const privateKeyPath = process.env.LIGHTAI_BUILD_SIGNING_KEY_PATH;
const privateKeyInline = process.env.LIGHTAI_BUILD_SIGNING_KEY;
const outputPath = process.env.LIGHTAI_SIGN_OUTPUT ?? 'desktop/signature/build-integrity.json';

if (!privateKeyPath && !privateKeyInline) {
  throw new Error('Missing signing key. Set LIGHTAI_BUILD_SIGNING_KEY or LIGHTAI_BUILD_SIGNING_KEY_PATH.');
}

const resolvedTarget = resolve(process.cwd(), target);
const payload = readFileSync(resolvedTarget);
const digestHex = createHash('sha256').update(payload).digest('hex');

const signer = createSign('sha256');
signer.update(digestHex);
signer.end();

const privateKey = privateKeyInline ?? readFileSync(resolve(process.cwd(), privateKeyPath), 'utf8');
const signatureBase64 = signer.sign(privateKey).toString('base64');

const metadata = {
  algorithm: 'sha256',
  targetPath: target,
  digestHex,
  signatureBase64,
  signedAt: new Date().toISOString()
};

const resolvedOutput = resolve(process.cwd(), outputPath);
mkdirSync(dirname(resolvedOutput), { recursive: true });
writeFileSync(resolvedOutput, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

console.log(`Signed ${target}`);
console.log(`Integrity metadata: ${outputPath}`);
