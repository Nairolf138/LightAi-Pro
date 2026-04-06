#!/usr/bin/env node
import { execSync } from 'node:child_process';

const rollbackTag = process.env.LIGHTAI_ROLLBACK_TAG;
if (!rollbackTag) {
  throw new Error('LIGHTAI_ROLLBACK_TAG is required (example: v1.3.2).');
}

const currentTag = process.env.LIGHTAI_CURRENT_TAG ?? 'unknown';

const tags = execSync('git tag --list', { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const skipTagCheck = process.env.LIGHTAI_SKIP_TAG_CHECK === 'true';
if (!skipTagCheck && !tags.includes(rollbackTag)) {
  throw new Error(`Rollback tag ${rollbackTag} does not exist in repository tags.`);
}

const rollbackPlan = {
  generatedAt: new Date().toISOString(),
  currentTag,
  rollbackTag,
  steps: [
    'Freeze update channel stable and beta.',
    `Promote signed artifacts from ${rollbackTag} as latest stable.`,
    'Publish incident note in release notes and status page.',
    'Collect crash telemetry and open postmortem ticket.'
  ]
};

process.stdout.write(`${JSON.stringify(rollbackPlan, null, 2)}\n`);
