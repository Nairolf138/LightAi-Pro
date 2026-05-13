import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const desktopDir = join(repoRoot, 'desktop');
const electronExecutable = process.platform === 'win32' ? 'electron.cmd' : 'electron';
const electronBin = join(desktopDir, 'node_modules', '.bin', electronExecutable);

if (existsSync(electronBin)) {
  process.exit(0);
}

console.log('Desktop dependencies are missing. Installing dependencies in ./desktop...');

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const install = spawnSync(npmExecutable, ['install', '--prefix', desktopDir], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: false,
});

if (install.error) {
  console.error(`Unable to start npm install for desktop dependencies: ${install.error.message}`);
  process.exit(1);
}

if (install.status !== 0) {
  console.error('Unable to install desktop dependencies. Run `npm install --prefix desktop` and retry.');
  process.exit(install.status ?? 1);
}

if (!existsSync(electronBin)) {
  console.error('Desktop dependencies were installed, but the Electron executable was not found.');
  process.exit(1);
}
