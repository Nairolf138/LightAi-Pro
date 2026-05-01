import { assert, test } from '../harness';
import { LiveSafetyManager } from '../../src/lib/liveSafety';

test('LiveSafetyManager blocks destructive automatic actions when enabled', () => {
  const manager = new LiveSafetyManager();
  manager.enable('session');

  const decision = manager.canRun('destructive_automatic');

  assert.equal(decision.allowed, false);
  assert.match(decision.reason ?? '', /blocks destructive automatic/i);
});

test('LiveSafetyManager requires confirmation for runtime push and high-impact actions when enabled', () => {
  const manager = new LiveSafetyManager();
  manager.enable('project');

  const runtimeDecision = manager.canRun('runtime_push');
  const blackoutDecision = manager.canRunHighImpact('global_blackout');

  assert.equal(runtimeDecision.allowed, true);
  assert.equal(runtimeDecision.requiresConfirmation, true);
  assert.equal(blackoutDecision.allowed, true);
  assert.equal(blackoutDecision.requiresConfirmation, true);
});
