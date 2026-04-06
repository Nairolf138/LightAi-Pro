#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const matrixPath = resolve(process.cwd(), 'desktop/release/project-compatibility.json');
const appVersion = process.env.LIGHTAI_APP_VERSION;
const projectVersion = Number(process.env.LIGHTAI_PROJECT_FORMAT_VERSION ?? NaN);

if (!appVersion) {
  throw new Error('LIGHTAI_APP_VERSION is required (example: 1.4.0).');
}

if (!Number.isFinite(projectVersion)) {
  throw new Error('LIGHTAI_PROJECT_FORMAT_VERSION must be a number.');
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const major = String(appVersion.split('.')[0]);
const policy = matrix[major];

if (!policy) {
  throw new Error(`No compatibility policy for app major ${major}.`);
}

if (projectVersion < policy.projectVersion.min || projectVersion > policy.projectVersion.max) {
  throw new Error(
    `Project format ${projectVersion} incompatible with app ${appVersion}. Supported range: ${policy.projectVersion.min}-${policy.projectVersion.max}.`
  );
}

console.log(
  `Compatibility OK: app ${appVersion} supports project format ${projectVersion} (range ${policy.projectVersion.min}-${policy.projectVersion.max}).`
);
