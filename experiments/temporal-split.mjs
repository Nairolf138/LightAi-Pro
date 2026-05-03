import fs from 'node:fs';

function parseArgs(argv) {
  const args = { trainRatio: '0.8' };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.input || !args.trainOut || !args.testOut) {
  console.error('Usage: node experiments/temporal-split.mjs --input <features.jsonl> --trainOut <train.jsonl> --testOut <test.jsonl> [--trainRatio 0.8]');
  process.exit(1);
}

const trainRatio = Number(args.trainRatio);
const rows = fs.readFileSync(args.input, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const sorted = rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
const cut = Math.max(1, Math.floor(sorted.length * trainRatio));
const train = sorted.slice(0, cut);
const test = sorted.slice(cut);

fs.writeFileSync(args.trainOut, `${train.map((r) => JSON.stringify(r)).join('\n')}\n`);
fs.writeFileSync(args.testOut, `${test.map((r) => JSON.stringify(r)).join('\n')}\n`);
console.log(`Temporal split -> train:${train.length} test:${test.length}`);
