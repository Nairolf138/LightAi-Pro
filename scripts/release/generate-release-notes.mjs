#!/usr/bin/env node
import { execSync } from 'node:child_process';

const tag = process.env.LIGHTAI_RELEASE_TAG;
if (!tag) {
  throw new Error('LIGHTAI_RELEASE_TAG is required.');
}

let previousTag = '';
try {
  previousTag = execSync('git describe --tags --abbrev=0 HEAD^', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {
  previousTag = '';
}

const range = previousTag ? `${previousTag}..HEAD` : 'HEAD';
const commits = execSync(`git log ${range} --pretty=format:%s`, { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => `- ${line}`)
  .join('\n');

const notes = [
  `## LightAI Pro ${tag}`,
  '',
  '### Highlights',
  commits || '- Initial release',
  '',
  '### Upgrade safety',
  '- Backup automatique projet conseillé avant upgrade.',
  '- Rollback supporté vers la dernière version stable signée.',
  '',
  '### Compatibility',
  '- Vérifiez `desktop/release/project-compatibility.json` pour la matrice app/projet.'
].join('\n');

process.stdout.write(notes);
