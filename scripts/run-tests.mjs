import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tempDir = await mkdtemp(join(tmpdir(), 'lightai-tests-'));

try {
  const outputFile = join(tempDir, 'tests.bundle.mjs');
  await build({
    entryPoints: ['tests/index.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: 'inline',
    outfile: outputFile,
    logLevel: 'silent',
  });

  await import(pathToFileURL(outputFile).href);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
