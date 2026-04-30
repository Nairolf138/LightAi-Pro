import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
const contractsPath = 'desktop/ipc/contracts.ts';
const migrationNotePath = 'docs/architecture/ipc-contract-migrations.md';

const resolveBaseRef = () => {
  try {
    execSync(`git rev-parse --verify ${baseRef}`, { stdio: 'ignore' });
    return baseRef;
  } catch {
    return 'HEAD~1';
  }
};
const effectiveBaseRef = resolveBaseRef();

const changedFiles = execSync(`git diff --name-only ${effectiveBaseRef}...HEAD`, { encoding: 'utf8' })
  .split('\n')
  .map((x) => x.trim())
  .filter(Boolean);

if (!changedFiles.includes(contractsPath)) {
  console.log('IPC contracts unchanged; governance check skipped.');
  process.exit(0);
}

const currentContracts = readFileSync(contractsPath, 'utf8');
const currentVersion = currentContracts.match(/IPC_CONTRACT_VERSION = '([^']+)'/)?.[1];
const baseContracts = execSync(`git show ${effectiveBaseRef}:${contractsPath}`, { encoding: 'utf8' });
const baseVersion = baseContracts.match(/IPC_CONTRACT_VERSION = '([^']+)'/)?.[1];

if (!currentVersion || !baseVersion) {
  console.log('Unable to compare IPC_CONTRACT_VERSION against base ref; skipping strict check in this environment.');
  process.exit(0);
}

if (currentVersion === baseVersion) {
  throw new Error(`IPC contracts changed but version was not bumped (still ${currentVersion}).`);
}

if (!changedFiles.includes(migrationNotePath)) {
  throw new Error(`IPC contract version bumped (${baseVersion} -> ${currentVersion}) but migration note is missing in ${migrationNotePath}.`);
}

console.log(`IPC governance check passed (${baseVersion} -> ${currentVersion}).`);
