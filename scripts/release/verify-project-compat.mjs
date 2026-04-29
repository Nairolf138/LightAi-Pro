#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const matrixPath = resolve(process.cwd(), 'desktop/release/project-compatibility.json');
const appVersionRaw = process.env.LIGHTAI_APP_VERSION;
const projectVersion = Number(process.env.LIGHTAI_PROJECT_FORMAT_VERSION ?? NaN);

if (!appVersionRaw) {
  throw new Error('LIGHTAI_APP_VERSION is required (example: v1.4.0 or 1.4.0).');
}

if (!Number.isFinite(projectVersion)) {
  throw new Error('LIGHTAI_PROJECT_FORMAT_VERSION must be a number.');
}

const appVersion = appVersionRaw.replace(/^v/i, '');
const major = String(Number.parseInt(appVersion.split('.')[0], 10));
if (!major || major === 'NaN') {
  throw new Error(`Invalid LIGHTAI_APP_VERSION: ${appVersionRaw}`);
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const policy = matrix[major];

if (!policy) {
  throw new Error(`No compatibility policy for app major ${major}.`);
}

const min = Number(policy.projectVersion.min);
const max = Number(policy.projectVersion.max);
if (projectVersion < min || projectVersion > max) {
  throw new Error(`Project format ${projectVersion} incompatible with app ${appVersionRaw}. Supported range: ${min}-${max}.`);
}

console.log(`Compatibility OK: app ${appVersionRaw} supports project format ${projectVersion} (range ${min}-${max}).`);
