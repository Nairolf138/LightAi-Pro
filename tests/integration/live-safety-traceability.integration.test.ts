import { assert, test } from '../harness';
import { SuggestionPreviewQueue, ValidationAuditLog } from '../../src/lib/liveSafety';

test('AI suggestions are previewed before application and traced on validation/rejection', () => {
  const queue = new SuggestionPreviewQueue<{ cue: string }>();
  const auditLog = new ValidationAuditLog();

  queue.enqueue({
    suggestionId: 'sg-1',
    payload: { cue: 'Cue A' },
    before: { cue: 'Old Cue A' },
    after: { cue: 'Cue A' },
    diff: '- Old Cue A\n+ Cue A',
    source: { model: 'model-v3', ruleset: 'rules-v4' },
    createdAt: '2026-05-01T10:00:00.000Z'
  });

  const preview = queue.list();
  assert.equal(preview.length, 1);
  assert.equal(preview[0]?.suggestionId, 'sg-1');
  assert.match(preview[0]?.diff ?? '', /\+ Cue A/);

  const consumed = queue.dequeue('sg-1');
  assert.ok(consumed);

  auditLog.record({
    suggestionId: 'sg-1',
    outcome: 'validated',
    operatorId: 'op-7',
    timestamp: '2026-05-01T10:01:00.000Z',
    source: { model: 'model-v3', ruleset: 'rules-v4' }
  });

  auditLog.record({
    suggestionId: 'sg-2',
    outcome: 'rejected',
    operatorId: 'op-7',
    timestamp: '2026-05-01T10:02:00.000Z',
    source: { model: 'model-v3', ruleset: 'rules-v4' },
    reason: 'unsafe remap patch'
  });

  const events = auditLog.list();
  assert.equal(events.length, 2);
  assert.deepEqual(events.map((event) => event.outcome), ['validated', 'rejected']);
  assert.equal(events[1]?.reason, 'unsafe remap patch');
});
