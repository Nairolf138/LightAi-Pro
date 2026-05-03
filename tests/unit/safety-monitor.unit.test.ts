import { assert, test } from '../harness';
import { SafetyMonitor } from '../../src/runtime/safety-monitor';

test('SafetyMonitor blocks blackout frames', () => {
  const monitor = new SafetyMonitor();
  const result = monitor.validate({ values: { '1:1': 255, '1:2': 100 }, blackout: true });
  assert.equal(result.report.level, 'block');
  assert.equal(result.safeValues['1:1'], 0);
  assert.equal(result.safeValues['1:2'], 0);
});

test('SafetyMonitor clamps burst ramp delta', () => {
  const monitor = new SafetyMonitor();
  monitor.setProfile({ maxDeltaPerFrame: 20 });
  monitor.validate({ values: { '1:1': 0 }, blackout: false });
  const result = monitor.validate({ values: { '1:1': 255 }, blackout: false });
  assert.equal(result.report.level, 'warn');
  assert.equal(result.safeValues['1:1'], 20);
});

test('SafetyMonitor handles conflicting rules deterministically', () => {
  const monitor = new SafetyMonitor();
  monitor.setProfile({ forbidStrobe: true, zoneLimits: [{ zoneId: '1', maxIntensity: 10 }] });
  const result = monitor.validate({ values: { '1:5': 255 }, blackout: false, attributeByKey: { '1:5': 'strobe' } });
  assert.equal(result.safeValues['1:5'], 0);
  assert.ok(result.report.triggeredRules.length >= 1);
});
