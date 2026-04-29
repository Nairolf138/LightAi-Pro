import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tempDir = await mkdtemp(join(tmpdir(), 'lightai-phase2-bench-'));

try {
  const outputFile = join(tempDir, 'phase2-exit.bundle.mjs');
  await build({
    entryPoints: ['scripts/bench/phase2-exit.mjs'],
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
