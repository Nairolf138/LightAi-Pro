import { execSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const baseRef = process.env.GITHUB_BASE_REF;
const base = baseRef ? `origin/${baseRef}` : 'HEAD~1';
const mergeBase = sh(`git merge-base ${base} HEAD`);
const changed = sh(`git diff --name-only ${mergeBase} HEAD`).split('\n').filter(Boolean);

const criticalPrefixes = ['src/ai/', 'prompts/', 'rules/', 'jobs/ai-', 'experiments/'];
const hasCriticalAiChange = changed.some((file) => criticalPrefixes.some((prefix) => file.startsWith(prefix)));

if (!hasCriticalAiChange) {
  console.log('No critical AI changes detected; skip AI report presence check.');
  process.exit(0);
}

const hasEvalReport = changed.some((file) => file.startsWith('artifacts/ai-eval/report-') && file.endsWith('.json'));
if (!hasEvalReport) {
  console.error('Critical AI changes detected but no versioned report found in artifacts/ai-eval/report-*.json');
  process.exit(1);
}

console.log('Critical AI changes include a versioned evaluation report.');
