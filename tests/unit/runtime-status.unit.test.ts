import { IPC_CONTRACT_VERSION, assertRuntimeStatus } from '../../desktop/ipc/contracts';
import { buildIncidentReport } from '../../src/lib/observability';
import { cloneRuntimeStatus, createRuntimeFallbackStatus, runtimeClient, runtimeFallbackStatus } from '../../src/lib/runtimeClient';
import { assert, test } from '../harness';

test('runtime fallback: shared initial status satisfies the RuntimeStatus contract', () => {
  assert.doesNotThrow(() => assertRuntimeStatus(runtimeFallbackStatus));
  assert.equal(runtimeFallbackStatus.contractVersion, IPC_CONTRACT_VERSION);
  assert.equal(runtimeFallbackStatus.ready, false);
  assert.equal(runtimeFallbackStatus.connectedDeviceId, null);
  assert.equal(runtimeFallbackStatus.protocol, null);
  assert.equal(runtimeFallbackStatus.dryRun, true);
  assert.equal(runtimeFallbackStatus.deviceStatus, null);
  assert.deepEqual(runtimeFallbackStatus.metrics, {
    protocolQueueDepth: 0,
    protocolQueueHighWatermark: 0,
    protocolDroppedFrames: 0,
  });
});

test('runtime fallback: factory returns complete independent RuntimeStatus objects for AppStateContext', () => {
  const first = createRuntimeFallbackStatus();
  const second = createRuntimeFallbackStatus();

  assert.doesNotThrow(() => assertRuntimeStatus(first));
  assert.doesNotThrow(() => assertRuntimeStatus(second));
  assert.notEqual(first, second);
  assert.notEqual(first.metrics, second.metrics);
});

test('runtime client polling returns the same complete fallback shape in web mode', async () => {
  const status = await runtimeClient.getRuntimeStatus();

  assert.doesNotThrow(() => assertRuntimeStatus(status));
  assert.equal(status.compatible, true);
  assert.deepEqual(Object.keys(status).sort(), [
    'compatible',
    'connectedDeviceId',
    'contractVersion',
    'deviceStatus',
    'dryRun',
    'metrics',
    'protocol',
    'ready',
  ]);
});

test('incident export receives complete runtime status before polling', () => {
  const report = JSON.parse(buildIncidentReport({
    exportScope: 'private',
    runtimeStatus: createRuntimeFallbackStatus(),
    appConfig: {},
  }));

  assert.doesNotThrow(() => assertRuntimeStatus(report.runtimeStatus));
  assert.deepEqual(Object.keys(report.runtimeStatus).sort(), [
    'connectedDeviceId',
    'contractVersion',
    'deviceStatus',
    'dryRun',
    'metrics',
    'protocol',
    'ready',
  ]);
});

test('incident export receives complete runtime status after runtime polling', async () => {
  const status = cloneRuntimeStatus(await runtimeClient.getRuntimeStatus());
  const report = JSON.parse(buildIncidentReport({
    exportScope: 'private',
    runtimeStatus: status,
    appConfig: {},
  }));

  assert.doesNotThrow(() => assertRuntimeStatus(report.runtimeStatus));
  assert.deepEqual(Object.keys(report.runtimeStatus).sort(), [
    'connectedDeviceId',
    'contractVersion',
    'deviceStatus',
    'dryRun',
    'metrics',
    'protocol',
    'ready',
  ]);
});
