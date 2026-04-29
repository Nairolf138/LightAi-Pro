import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { ShowController } from '../../src/core/show/controller.ts';
import { LightingOutputRouter } from '../../src/core/protocols/selector.ts';
import { ShowProtocolLink } from '../../src/core/show/protocol-link.ts';

const OUTPUT_DIR = 'artifacts/phase2-exit';
const TICKET_MAP = {
  p2c01: ['PROTO-201', 'QA-231'],
  p2c02: ['PROTO-202', 'PROTO-203'],
  p2c04: ['CUE-221', 'QA-233'],
  p2c05: ['PROTO-204', 'QA-234'],
};

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const buildTimeline = () => ({
  version: 1,
  entryCueId: 'cue-1',
  output: { activeDriver: 'simulator', simulator: { kind: 'simulator', latencyMs: 0 } },
  chases: {},
  scenes: {
    s1: { id: 's1', name: 'S1', values: [{ universeId: '1', channel: 1, value: 255 }] },
    s2: { id: 's2', name: 'S2', values: [{ universeId: '1', channel: 1, value: 128 }] },
  },
  cues: {
    'cue-1': { id: 'cue-1', name: 'Cue1', sceneId: 's1', transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' } },
    'cue-2': { id: 'cue-2', name: 'Cue2', sceneId: 's2', transition: { fadeInMs: 0, holdMs: 1000, fadeOutMs: 0, follow: 'hold' } },
  },
});

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

  for (let i = 0; i < 300; i += 1) {
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

  const scenarioChecks = {
    play: controller.go(1000).activeCueId === 'cue-1',
    stop: controller.pause(1100).activeCueId === 'cue-1',
    next: controller.jumpCue('cue-2', 1200).activeCueId === 'cue-2',
    prev: controller.back(1300).activeCueId === 'cue-1',
    blackout: controller.blackout(1400).blackout === true,
  };

  const metrics = {
    generatedAt: new Date().toISOString(),
    p2c01: { tickets: TICKET_MAP.p2c01, latencyMs: { p95: percentile(latencies, 95), max: Math.max(...latencies) } },
    p2c02: { tickets: TICKET_MAP.p2c02, frames: { sent, failed, reliability: sent / (sent + failed) } },
    p2c04: { tickets: TICKET_MAP.p2c04, criticalScenarios: scenarioChecks },
    p2c05: { tickets: TICKET_MAP.p2c05, reconnectMs: { p95: percentile(reconnectDurations, 95), max: Math.max(...reconnectDurations) } },
  };

  logs.push(`[PROTO-201] Latency p95=${metrics.p2c01.latencyMs.p95.toFixed(3)}ms`);
  logs.push(`[PROTO-202] Reliability=${(metrics.p2c02.frames.reliability * 100).toFixed(4)}% (${sent}/${sent + failed})`);
  logs.push(`[CUE-221] Scenarios=${JSON.stringify(scenarioChecks)}`);
  logs.push(`[PROTO-204] Reconnect p95=${metrics.p2c05.reconnectMs.p95.toFixed(3)}ms`);

  const report = `# Phase 2 Exit Bench Report\n\n- Date: ${new Date().toISOString()}\n- Scope: protocols + cue/show + lighting-engine\n\n## Résultats\n- P2-C01 [${TICKET_MAP.p2c01.join(', ')}]: p95 latence ${metrics.p2c01.latencyMs.p95.toFixed(3)} ms\n- P2-C02 [${TICKET_MAP.p2c02.join(', ')}]: fiabilité ${(metrics.p2c02.frames.reliability * 100).toFixed(4)}%\n- P2-C04 [${TICKET_MAP.p2c04.join(', ')}]: scénarios ${Object.values(scenarioChecks).every(Boolean) ? 'PASS' : 'FAIL'}\n- P2-C05 [${TICKET_MAP.p2c05.join(', ')}]: reconnexion p95 ${metrics.p2c05.reconnectMs.p95.toFixed(3)} ms\n`;

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(`${OUTPUT_DIR}/phase2-metrics.json`, JSON.stringify(metrics, null, 2));
  await writeFile(`${OUTPUT_DIR}/phase2-bench.log`, `${logs.join('\n')}\n`);
  await writeFile(`${OUTPUT_DIR}/phase2-report.md`, report);
};

await run();
