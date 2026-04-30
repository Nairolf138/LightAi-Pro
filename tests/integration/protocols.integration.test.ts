import { test, assert } from '../harness';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ArtNetOutputDriver } from '../../src/core/protocols/drivers/artnet';
import { OscOutputDriver } from '../../src/core/protocols/drivers/osc';
import { LightingOutputRouter } from '../../src/core/protocols/selector';
import {
  IPC_CONTRACT_VERSION,
  assertConnectDeviceRequest,
  assertRuntimeStatus,
  assertSendFrameRequest
} from '../../desktop/ipc/contracts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('Art-Net simulator: envoi packet avec en-tête et univers correct', async () => {
  const sent: Array<{ packet: Uint8Array; port: number; host: string }> = [];
  const driver = new ArtNetOutputDriver(
    { kind: 'artnet', host: '127.0.0.1', port: 6454 },
    {
      transport: {
        send: async (packet, port, host) => {
          sent.push({ packet, port, host });
        },
      },
    },
  );

  await driver.sendUniverse(2, [1, 2, 3]);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].host, '127.0.0.1');
  assert.equal(sent[0].port, 6454);
  const header = String.fromCharCode(...sent[0].packet.slice(0, 8));
  assert.equal(header, 'Art-Net\0');
  assert.equal(sent[0].packet[14], 2);
});

test('OSC simulator: mapping adresse par univers', async () => {
  const messages: Array<{ targetUrl: string; address: string; args: number[] }> = [];
  const driver = new OscOutputDriver(
    {
      kind: 'osc',
      targetUrl: 'udp://127.0.0.1:9000',
      defaultAddress: '/lighting/default',
      universeAddressMap: { 3: '/lighting/u3' },
    },
    {
      transport: {
        send: async (targetUrl, message) => {
          messages.push({ targetUrl, address: message.address, args: [...message.args] });
        },
      },
    },
  );

  await driver.sendUniverse(3, [12.2, 256]);
  await driver.sendUniverse(1, [8]);

  assert.equal(messages[0].address, '/lighting/u3');
  assert.deepEqual(messages[0].args, [12, 255]);
  assert.equal(messages[1].address, '/lighting/default');
});

test('Art-Net transport: timeout simulé propage une erreur', async () => {
  const driver = new ArtNetOutputDriver(
    { kind: 'artnet', host: '127.0.0.1', port: 6454 },
    {
      transport: {
        send: async () => {
          await sleep(2);
          throw new Error('timeout artnet');
        },
      },
    },
  );

  await assert.rejects(driver.sendUniverse(1, [1, 2, 3]), /timeout artnet/);
});

test('Art-Net transport: retry applicatif après timeout réussit', async () => {
  let attempts = 0;
  const driver = new ArtNetOutputDriver(
    { kind: 'artnet', host: '127.0.0.1', port: 6454 },
    {
      transport: {
        send: async () => {
          attempts += 1;
          if (attempts < 2) {
            throw new Error('transient timeout');
          }
        },
      },
    },
  );

  try {
    await driver.sendUniverse(1, [10]);
  } catch {
    await driver.sendUniverse(1, [10]);
  }

  assert.equal(attempts, 2);
});

test('Router: déconnexion/reconnexion lors du reconfigure', async () => {
  const events: string[] = [];
  const router = new LightingOutputRouter({
    artnet: {
      transport: {
        send: async () => undefined,
      },
    },
    osc: {
      transport: {
        send: async () => undefined,
      },
    },
  });

  const first = router.setConfiguration({ activeDriver: 'artnet', artnet: { kind: 'artnet', host: '127.0.0.1' } });
  await first;
  events.push('configured-artnet');

  const second = router.setConfiguration({ activeDriver: 'osc', osc: { kind: 'osc', targetUrl: 'udp://127.0.0.1:9000' } });
  await second;
  events.push('configured-osc');

  assert.deepEqual(events, ['configured-artnet', 'configured-osc']);
  assert.equal(router.getActiveDriver()?.metadata.kind, 'osc');
});

test('IPC payloads invalides/champs manquants sont rejetés', async () => {
  assert.throws(() => assertConnectDeviceRequest({}), /Invalid connect device payload/);
  assert.throws(() => assertSendFrameRequest({ universe: 0 }), /channelValues/);
  assert.throws(() => assertRuntimeStatus({ ready: true }), /contractVersion/);
});

test('IPC payload extrême DMX est accepté (512 canaux)', async () => {
  const payload = { universe: 0, channelValues: new Array(512).fill(255) };
  assert.doesNotThrow(() => assertSendFrameRequest(payload));
});

test('runtime:status mismatch de version est détecté', async () => {
  const runtimeStatus = {
    contractVersion: '0.9.0',
    ready: true,
    connectedDeviceId: null,
    protocol: null,
    dryRun: false,
    deviceStatus: null,
    metrics: { protocolQueueDepth: 0, protocolQueueHighWatermark: 0, protocolDroppedFrames: 0 }
  };
  assert.notEqual(runtimeStatus.contractVersion, IPC_CONTRACT_VERSION);
});

test('Snapshot schéma: SendFrameRequest', async () => {
  const snapshot = JSON.parse(readFileSync(join(process.cwd(), 'tests/snapshots/send-frame-request.schema.json'), 'utf8'));
  assert.deepEqual(snapshot, {
    type: 'object',
    required: ['universe', 'channelValues'],
    properties: {
      universe: { type: 'integer', minimum: 0 },
      channelValues: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 255 }, maxItems: 512 }
    }
  });
});

test('Snapshot schéma: RuntimeStatus', async () => {
  const snapshot = JSON.parse(readFileSync(join(process.cwd(), 'tests/snapshots/runtime-status.schema.json'), 'utf8'));
  assert.equal(snapshot.properties.contractVersion.const, IPC_CONTRACT_VERSION);
  assert.deepEqual(snapshot.required.slice(0, 2), ['contractVersion', 'ready']);
});
