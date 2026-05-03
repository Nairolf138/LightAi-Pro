import { test, assert } from '../../harness';
import { TimeSyncClockAuthority } from '../../../src/runtime/time-sync';

test('Time sync: lock, perte source, reprise et diagnostics', () => {
  let nowMs = 1_000;
  const clock = new TimeSyncClockAuthority({ now: () => nowMs, lockTimeoutMs: 100 });

  clock.lock('ltc');
  assert.equal(clock.getSnapshot().status, 'degraded');

  clock.ingestFrame({ source: 'ltc', timeMs: 1_010, receivedAtMs: nowMs });
  let snapshot = clock.getSnapshot();
  assert.equal(snapshot.status, 'locked');
  assert.equal(snapshot.authority, 'ltc');
  assert.equal(snapshot.diagnostics.resyncEvents, 1);

  nowMs += 150;
  snapshot = clock.getSnapshot();
  assert.equal(snapshot.status, 'degraded');
  assert.equal(snapshot.diagnostics.lockLossCount, 1);

  clock.ingestFrame({ source: 'ltc', timeMs: 1_160, receivedAtMs: nowMs });
  snapshot = clock.getSnapshot();
  assert.equal(snapshot.status, 'locked');
  assert.equal(snapshot.diagnostics.resyncEvents, 2);
  assert.equal(snapshot.diagnostics.jitterMs > 0, true);
});

test('Time sync: offset manuel + free-run après unlock', () => {
  let nowMs = 2_000;
  const clock = new TimeSyncClockAuthority({ now: () => nowMs, lockTimeoutMs: 100 });

  clock.setManualOffset(25);
  clock.lock('osc');
  clock.ingestFrame({ source: 'osc', timeMs: 2_020, receivedAtMs: nowMs });

  const lockedNow = clock.now();
  assert.equal(lockedNow > nowMs, true);

  clock.unlock();
  nowMs += 10;
  const freeRun = clock.getSnapshot();
  assert.equal(freeRun.status, 'free-run');
  assert.equal(freeRun.authority, 'internal');
  assert.equal(freeRun.nowMs, nowMs + 25);
});

test('Time sync: cohérence cues déclenchées pendant lock/degraded', () => {
  let nowMs = 10_000;
  const clock = new TimeSyncClockAuthority({ now: () => nowMs, lockTimeoutMs: 80 });
  clock.lock('mtc');

  const cueAt = 10_060;
  let fired = false;

  clock.ingestFrame({ source: 'mtc', timeMs: 10_050, receivedAtMs: nowMs });
  nowMs += 5;
  if (clock.now() >= cueAt) fired = true;
  assert.equal(fired, false);

  clock.ingestFrame({ source: 'mtc', timeMs: 10_065, receivedAtMs: nowMs });
  if (clock.now() >= cueAt) fired = true;
  assert.equal(fired, true);

  nowMs += 120;
  const degraded = clock.getSnapshot();
  assert.equal(degraded.status, 'degraded');

  const previousNow = degraded.nowMs;
  nowMs += 20;
  const degradedTick = clock.getSnapshot();
  assert.equal(degradedTick.nowMs > previousNow, true);
});
