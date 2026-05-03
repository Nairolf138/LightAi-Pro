import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.input || !args.datasetSnapshot || !args.promptRulesVersion) {
  console.error('Usage: node experiments/run-eval.mjs --input <events.jsonl> --datasetSnapshot <id> --promptRulesVersion <id>');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-eval-'));
const features = path.join(tmp, 'features.jsonl');
const train = path.join(tmp, 'train.jsonl');
const test = path.join(tmp, 'test.jsonl');
const baseline = path.join(tmp, 'baseline.json');

execSync(`node experiments/generate-features.mjs --input ${args.input} --output ${features}`, { stdio: 'inherit' });
execSync(`node experiments/temporal-split.mjs --input ${features} --trainOut ${train} --testOut ${test}`, { stdio: 'inherit' });
execSync(`node experiments/score-baseline.mjs --input ${test} --output ${baseline}`, { stdio: 'inherit' });

const metrics = JSON.parse(fs.readFileSync(baseline, 'utf8'));
const codeVersion = execSync('git rev-parse HEAD').toString().trim();
const runSignature = `${args.datasetSnapshot}__${args.promptRulesVersion}__${codeVersion.slice(0, 12)}`;

const report = {
  runSignature,
  generatedAt: new Date().toISOString(),
  codeVersion,
  promptRulesVersion: args.promptRulesVersion,
  datasetSnapshotId: args.datasetSnapshot,
  metrics
};

fs.mkdirSync('artifacts/ai-eval', { recursive: true });
const outPath = `artifacts/ai-eval/report-${runSignature}.json`;
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Wrote signed report: ${outPath}`);
