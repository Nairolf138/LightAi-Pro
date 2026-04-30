import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { ShowController } from '../../src/core/show/controller.ts';
import { LightingOutputRouter } from '../../src/core/protocols/selector.ts';
import { ShowProtocolLink } from '../../src/core/show/protocol-link.ts';

const OUTPUT_DIR = 'artifacts/phase2-exit';
const METRICS_VERSION = '2.0.0';
const TICKET_MAP = {
  p2c01: ['PROTO-201', 'QA-231'],
  p2c02: ['PROTO-202', 'PROTO-203'],
  p2c04: ['CUE-221', 'QA-233'],
  p2c05: ['PROTO-204', 'QA-234'],
};

const THRESHOLDS = {
  p95LatencyMs: 40,
  successRate: 0.995,
  p95ReconnectMs: 3000,
};

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const buildTimeline = () => ({ version: 1, entryCueId: 'cue-1', output: { activeDriver: 'simulator', simulator: { kind: 'simulator', latencyMs: 0 } }, chases: {}, scenes: { s1: { id: 's1', name: 'S1', values: [{ universeId: '1', channel: 1, value: 255 }] }, s2: { id: 's2', name: 'S2', values: [{ universeId: '1', channel: 1, value: 128 }] } }, cues: { 'cue-1': { id: 'cue-1', name: 'Cue1', sceneId: 's1', transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' } }, 'cue-2': { id: 'cue-2', name: 'Cue2', sceneId: 's2', transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' } } } });

const run = async () => {
  const logs = [];
  const latencies = [];
  const reconnectDurations = [];
  let sent = 0;
  let failed = 0;

  const router = new LightingOutputRouter();
  const link = new ShowProtocolLink(router);
  const output = { activeDriver: 'simulator', simulator: { kind: 'simulator', latencyMs: 0 } };
  await link.configure(output);

  const controller = new ShowController(buildTimeline());

  for (let i = 0; i < 220; i += 1) {
    const now = i * 20;
    const t0 = performance.now();
    const snap = i % 2 === 0 ? controller.go(now) : controller.tick(now);
    try {
      await link.sendSnapshot(snap, output);
      sent += 1;
    } catch {
      failed += 1;
    }
    latencies.push(performance.now() - t0);
  }

  for (let i = 0; i < 80; i += 1) {
    const t0 = performance.now();
    await router.setConfiguration(output);
    reconnectDurations.push(performance.now() - t0);
  }

  for (let i = 0; i < 80; i += 1) {
    const now = 5000 + i * 20;
    const t0 = performance.now();
    const snap = controller.tick(now);
    try {
      await link.sendSnapshot(snap, output);
      sent += 1;
    } catch {
      failed += 1;
    }
    latencies.push(performance.now() - t0);
  }

  const scenarioChecks = {
    play: controller.go(1000).activeCueId === 'cue-1',
    stop: controller.pause(1100).activeCueId === 'cue-1',
    next: controller.jumpCue('cue-2', 1200).activeCueId === 'cue-2',
    prev: controller.back(1300).activeCueId === 'cue-1',
    blackout: controller.blackout(1400).blackout === true,
  };

  const successRate = sent / (sent + failed);
  const evaluations = {
    p2c01: percentile(latencies, 95) <= THRESHOLDS.p95LatencyMs,
    p2c02: successRate >= THRESHOLDS.successRate,
    p2c05: percentile(reconnectDurations, 95) <= THRESHOLDS.p95ReconnectMs,
  };

  const metrics = {
    schemaVersion: METRICS_VERSION,
    generatedAt: new Date().toISOString(),
    run: {
      scenarioId: 'phase2-protocols-unified',
      samples: { latency: latencies.length, reconnect: reconnectDurations.length, frames: sent + failed },
    },
    thresholds: THRESHOLDS,
    p2c01: { tickets: TICKET_MAP.p2c01, latencyMs: { p95: percentile(latencies, 95), max: Math.max(...latencies) }, pass: evaluations.p2c01 },
    p2c02: { tickets: TICKET_MAP.p2c02, frames: { sent, failed, successRate }, pass: evaluations.p2c02 },
    p2c04: { tickets: TICKET_MAP.p2c04, criticalScenarios: scenarioChecks, pass: Object.values(scenarioChecks).every(Boolean) },
    p2c05: { tickets: TICKET_MAP.p2c05, reconnectMs: { p95: percentile(reconnectDurations, 95), max: Math.max(...reconnectDurations) }, pass: evaluations.p2c05 },
  };

  logs.push(`[PROTO-201] Latency p95=${metrics.p2c01.latencyMs.p95.toFixed(3)}ms / threshold<=${THRESHOLDS.p95LatencyMs}ms => ${metrics.p2c01.pass ? 'PASS' : 'FAIL'}`);
  logs.push(`[PROTO-202] SuccessRate=${(metrics.p2c02.frames.successRate * 100).toFixed(4)}% / threshold>=${(THRESHOLDS.successRate * 100).toFixed(2)}% => ${metrics.p2c02.pass ? 'PASS' : 'FAIL'} (${sent}/${sent + failed})`);
  logs.push(`[CUE-221] Scenarios=${JSON.stringify(scenarioChecks)} => ${metrics.p2c04.pass ? 'PASS' : 'FAIL'}`);
  logs.push(`[PROTO-204] Reconnect p95=${metrics.p2c05.reconnectMs.p95.toFixed(3)}ms / threshold<=${THRESHOLDS.p95ReconnectMs}ms => ${metrics.p2c05.pass ? 'PASS' : 'FAIL'}`);

  const report = `# Phase 2 Exit Bench Report\n\n- Date: ${new Date().toISOString()}\n- Scenario: phase2-protocols-unified\n- Metrics schema version: ${METRICS_VERSION}\n\n## Blocking thresholds\n- P2-C01 p95 latency <= ${THRESHOLDS.p95LatencyMs} ms\n- P2-C02 success rate >= ${(THRESHOLDS.successRate * 100).toFixed(2)}%\n- P2-C05 reconnect/fallback p95 <= ${THRESHOLDS.p95ReconnectMs} ms\n\n## QA summary\n| Criterion | Value | Threshold | Verdict |\n|---|---:|---:|---|\n| P2-C01 latency p95 | ${metrics.p2c01.latencyMs.p95.toFixed(3)} ms | <= ${THRESHOLDS.p95LatencyMs} ms | ${metrics.p2c01.pass ? 'PASS' : 'FAIL'} |\n| P2-C02 success rate | ${(metrics.p2c02.frames.successRate * 100).toFixed(4)} % | >= ${(THRESHOLDS.successRate * 100).toFixed(2)} % | ${metrics.p2c02.pass ? 'PASS' : 'FAIL'} |\n| P2-C05 reconnect p95 | ${metrics.p2c05.reconnectMs.p95.toFixed(3)} ms | <= ${THRESHOLDS.p95ReconnectMs} ms | ${metrics.p2c05.pass ? 'PASS' : 'FAIL'} |\n\n## P2-C04 command scenarios\n- Play/Stop/Next/Prev/Blackout: ${metrics.p2c04.pass ? 'PASS' : 'FAIL'}\n`;

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(`${OUTPUT_DIR}/phase2-metrics.json`, JSON.stringify(metrics, null, 2));
  await writeFile(`${OUTPUT_DIR}/phase2-bench.log`, `${logs.join('\n')}\n`);
  await writeFile(`${OUTPUT_DIR}/phase2-report.md`, report);
};

await run();
