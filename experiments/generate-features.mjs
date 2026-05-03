import fs from 'node:fs';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.input || !args.output) {
  console.error('Usage: node experiments/generate-features.mjs --input <jsonl> --output <jsonl>');
  process.exit(1);
}

const rows = fs.readFileSync(args.input, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const byActor = new Map();

const features = rows
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  .map((event) => {
    const history = byActor.get(event.actor_id) ?? { count: 0, lastTs: null };
    const ts = new Date(event.timestamp).getTime();
    const hour = new Date(event.timestamp).getUTCHours();
    const deltaMinutes = history.lastTs ? (ts - history.lastTs) / 60000 : null;

    const row = {
      event_id: event.event_id,
      timestamp: event.timestamp,
      actor_id: event.actor_id,
      event_type: event.event_type,
      severity: Number(event.severity ?? 0),
      actor_event_count_before: history.count,
      minutes_since_last_actor_event: deltaMinutes,
      hour_utc: hour,
      label: Number(event.label)
    };

    byActor.set(event.actor_id, { count: history.count + 1, lastTs: ts });
    return row;
  });

fs.writeFileSync(args.output, `${features.map((r) => JSON.stringify(r)).join('\n')}\n`);
console.log(`Generated ${features.length} feature rows -> ${args.output}`);
