#!/usr/bin/env node
import { execSync } from 'node:child_process';

const rollbackTag = process.env.LIGHTAI_ROLLBACK_TAG;
if (!rollbackTag) {
  throw new Error('LIGHTAI_ROLLBACK_TAG is required (example: v1.3.2).');
}

const currentTag = process.env.LIGHTAI_CURRENT_TAG ?? 'unknown';
const format = process.env.LIGHTAI_ROLLBACK_FORMAT ?? 'json';
const validate = process.env.LIGHTAI_ROLLBACK_VALIDATE === 'true';

const tags = execSync('git tag --list', { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const skipTagCheck = process.env.LIGHTAI_SKIP_TAG_CHECK === 'true';
if (!skipTagCheck && !tags.includes(rollbackTag)) {
  throw new Error(`Rollback tag ${rollbackTag} does not exist in repository tags.`);
}

const steps = [
  'Freeze update channels: stable + beta.',
  `Promote signed artifacts from ${rollbackTag} as latest stable.`,
  'Publish rollback communication in release notes and status page.',
  'Validate updater manifests and checksums after promotion.',
  'Collect crash telemetry and open postmortem ticket.'
];

const rollbackPlan = {
  generatedAt: new Date().toISOString(),
  currentTag,
  rollbackTag,
  validated: validate,
  steps
};

if (format === 'markdown') {
  process.stdout.write(`- Current release: ${currentTag}\n`);
  process.stdout.write(`- Rollback target: ${rollbackTag}\n`);
  process.stdout.write(`- Validation: ${validate ? 'tested in CI' : 'planned only'}\n`);
  process.stdout.write('\n');
  steps.forEach((step, index) => process.stdout.write(`${index + 1}. ${step}\n`));
} else {
  process.stdout.write(`${JSON.stringify(rollbackPlan, null, 2)}\n`);
}
