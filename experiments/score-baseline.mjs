import fs from 'node:fs';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function predictHeuristic(row) {
  const bursty = row.minutes_since_last_actor_event !== null && row.minutes_since_last_actor_event < 15;
  const highSeverity = row.severity >= 7;
  return bursty || highSeverity ? 1 : 0;
}

function predictPseudoLlmScore(row) {
  const risk =
    0.45 * Number(row.severity) +
    0.35 * Number(row.actor_event_count_before) +
    (row.minutes_since_last_actor_event !== null && row.minutes_since_last_actor_event < 20 ? 1.2 : -0.2) +
    (['login_failed', 'permission_change', 'export'].includes(row.event_type) ? 1 : 0);
  return sigmoid((risk - 2.8) / 1.5);
}

function computeMetrics(rows, preds, threshold = 0.5) {
  let tp = 0; let tn = 0; let fp = 0; let fn = 0;
  preds.forEach((p, i) => {
    const y = Number(rows[i].label);
    const yHat = p >= threshold ? 1 : 0;
    if (y === 1 && yHat === 1) tp += 1;
    if (y === 0 && yHat === 0) tn += 1;
    if (y === 0 && yHat === 1) fp += 1;
    if (y === 1 && yHat === 0) fn += 1;
  });
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const accuracy = rows.length === 0 ? 0 : (tp + tn) / rows.length;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, tn, fp, fn, precision, recall, accuracy, f1 };
}

const args = parseArgs(process.argv);
if (!args.input || !args.output) {
  console.error('Usage: node experiments/score-baseline.mjs --input <test.jsonl> --output <report.json>');
  process.exit(1);
}

const rows = fs.readFileSync(args.input, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const heuristicScores = rows.map((row) => predictHeuristic(row));
const llmScores = rows.map((row) => predictPseudoLlmScore(row));

const report = {
  heuristics: computeMetrics(rows, heuristicScores, 0.5),
  llmBaseline: computeMetrics(rows, llmScores, 0.5),
  sampleSize: rows.length
};

fs.writeFileSync(args.output, JSON.stringify(report, null, 2));
console.log(`Scored ${rows.length} rows -> ${args.output}`);
