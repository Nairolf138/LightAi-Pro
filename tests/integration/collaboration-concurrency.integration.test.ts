import { assert, test } from '../harness';
import { CollaborationRetryQueue } from '../../src/lib/collaborationRetryQueue';
import { buildGuidedMergePatch } from '../../src/lib/collaborationStrategy';

test('guided merge resolves field-level conflicts for concurrent edits', () => {
  const conflict = {
    entityType: 'cue' as const,
    sharedShowId: 'show-1',
    expectedVersion: 2,
    localPatch: { fadeMs: 800, label: 'Intro soft' },
    remoteState: { fadeMs: 1200, label: 'Intro hard', color: 'blue' },
    remoteVersion: 3,
    conflictingFields: ['fadeMs', 'label'],
    detectedAt: new Date().toISOString(),
  };

  const merged = buildGuidedMergePatch(conflict, {
    fieldChoices: {
      fadeMs: 'local',
      label: 'remote',
    },
  });

  assert.deepEqual(merged, { fadeMs: 800, label: 'Intro hard' });
});

test('retry queue is idempotent and retries failed network writes', async () => {
  const queue = new CollaborationRetryQueue<{ value: number }>();
  queue.enqueue('patch', 'job-1', { value: 1 });
  queue.enqueue('patch', 'job-1', { value: 999 });

  assert.equal(queue.pending().length, 1, 'idempotency key should dedupe duplicate jobs');

  let attempts = 0;
  await queue.flush(async () => {
    attempts += 1;
    throw new Error('network_down');
  });

  assert.equal(attempts, 1);
  assert.equal(queue.pending().length, 1, 'failed writes stay queued');

  queue.pending()[0].nextAttemptAt = Date.now() - 1;
  await queue.flush(async () => {
    attempts += 1;
  });

  assert.equal(attempts, 2);
  assert.equal(queue.pending().length, 0, 'successful replay drains queue');
});

test('concurrency scenario remains deterministic under high latency and reconnect replay', async () => {
  const events: string[] = [];
  const queue = new CollaborationRetryQueue<{ cueId: string }>();

  queue.enqueue('cue', 'cue-1-v3', { cueId: 'cue-1' });

  await queue.flush(async () => {
    events.push('offline-failure');
    throw new Error('offline');
  });

  assert.deepEqual(events, ['offline-failure']);
  assert.equal(queue.pending().length, 1);

  queue.pending()[0].nextAttemptAt = Date.now() - 1;
  await new Promise((resolve) => setTimeout(resolve, 25));
  await queue.flush(async () => {
    events.push('reconnected-write');
  });

  assert.deepEqual(events, ['offline-failure', 'reconnected-write']);
  assert.equal(queue.pending().length, 0);
});
