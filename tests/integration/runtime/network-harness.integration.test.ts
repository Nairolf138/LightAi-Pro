import { test, assert } from '../../harness';
import { FrameBackpressureController } from '../../../src/runtime/adapters/frameBackpressureController';
import { DryRunSimulatorAdapter } from '../../../src/runtime/adapters/dryRunSimulator';

class SimulatedNetwork {
  constructor(private jitterMs: number, private lossEvery: number) {}
  async transmit(i: number): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, this.jitterMs));
    return this.lossEvery === 0 ? true : i % this.lossEvery !== 0;
  }
}

test('Network harness: simulation jitter/latence + perte de paquets', async () => {
  const net = new SimulatedNetwork(2, 3);
  let ok = 0;
  for (let i = 1; i <= 9; i += 1) {
    if (await net.transmit(i)) ok += 1;
  }
  assert.equal(ok, 6);
});

test('Network harness: reconnexion + burst saturation + dégradation contrôlée', async () => {
  const adapter = new DryRunSimulatorAdapter();
  await adapter.connect();
  await adapter.disconnect();
  await adapter.connect();

  let clock = 0;
  const controller = new FrameBackpressureController(
    { maxQueueDepth: 3, throttleMs: 5, criticalUniverses: [1] },
    () => clock,
  );

  const decisions = [
    controller.enqueue({ universe: 2, frame: [0] }),
    controller.enqueue({ universe: 3, frame: [0] }),
    controller.enqueue({ universe: 4, frame: [0] }),
    controller.enqueue({ universe: 5, frame: [0] }),
    controller.enqueue({ universe: 1, frame: [255], criticalChannels: [1] }),
  ];

  assert.equal(decisions[3].accepted, false);
  assert.equal(decisions[4].accepted, true);

  for (let i = 0; i < 8; i += 1) {
    clock += 5;
    const task = controller.dequeueReady();
    if (task) {
      await adapter.sendFrame(task.universe, task.frame, { timestampMs: clock, criticalUniverses: [1] });
    }
  }

  assert.equal(adapter.events.some((event) => event.universe === 1), true);
});
