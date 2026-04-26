import { test, assert } from '../harness';
import {
  PATCH_SOURCE_FORMAT_PRIORITIES,
  buildShowGraphFromPatch,
  parsePatchSource,
} from '../../src/core/fixtures/patch-importer';
import { FixtureProfileRegistry } from '../../src/core/fixtures/registry';

const createRegistry = (): FixtureProfileRegistry => {
  const registry = new FixtureProfileRegistry();
  registry.importProfiles([
    {
      format: 'lightai.fixture.v1',
      manufacturer: 'LightAi',
      model: 'Spot 200',
      profileId: 'spot-200',
      modes: [
        {
          id: 'mode-8ch',
          name: '8ch',
          channels: [
            { key: 'dimmer', name: 'Dimmer', type: 'intensity', defaultValue: 0 },
            { key: 'pan', name: 'Pan', type: 'position', defaultValue: 127 },
          ],
        },
      ],
    },
  ]);

  return registry;
};

test('Formats patch source prioritaires: CSV > export console > JSON interne', () => {
  assert.deepEqual(
    PATCH_SOURCE_FORMAT_PRIORITIES.map((entry) => entry.format),
    ['csv', 'consoleExportJson', 'internalPatchJson'],
  );
});

test('Parseur CSV: détecte collision adresse et mode invalide dans le rapport', () => {
  const registry = createRegistry();
  const csvPayload = [
    'id,name,profileId,modeId,universe,address',
    'fx-1,Front Spot,spot-200,mode-8ch,1,1',
    'fx-2,Back Spot,spot-200,mode-8ch,1,1',
    'fx-3,Wrong Mode,spot-200,mode-404,1,10',
  ].join('\n');

  const parsed = parsePatchSource(csvPayload, registry);

  assert.equal(parsed.detectedFormat, 'csv');
  assert.ok(parsed.report.blockingErrors.some((issue) => issue.code === 'addressCollision'));
  assert.ok(parsed.report.blockingErrors.some((issue) => issue.code === 'invalidMode'));
  assert.match(parsed.report.readableSummary, /erreur\(s\) bloquante\(s\)/u);
});

test('Parseur export console: fixture inconnue remonte unknownProfile', () => {
  const registry = createRegistry();
  const consolePayload = {
    fixtures: [
      {
        fixtureId: 'c1',
        label: 'Console Fixture',
        fixtureType: 'unknown-profile',
        mode: 'mode-8ch',
        universe: 1,
        address: 50,
      },
    ],
  };

  const parsed = parsePatchSource(consolePayload, registry);

  assert.equal(parsed.detectedFormat, 'consoleExportJson');
  assert.ok(parsed.report.blockingErrors.some((issue) => issue.code === 'unknownProfile'));
});

test('Sortie Show Graph canonique générée depuis patch valide', () => {
  const registry = createRegistry();
  const parsed = parsePatchSource(
    [
      'id,name,profileId,modeId,universe,address',
      'fx-1,Front Spot,spot-200,mode-8ch,1,1',
      'fx-2,Back Spot,spot-200,mode-8ch,2,10',
    ].join('\n'),
    registry,
  );

  assert.equal(parsed.report.blockingErrors.length, 0);
  const showGraph = buildShowGraphFromPatch(parsed.fixtures, registry, {
    showId: 'tour-2026',
    title: 'Tour 2026',
    bpm: 128,
  });

  assert.equal(showGraph.metadata.showId, 'tour-2026');
  assert.equal(showGraph.dmx.fixtures.length, 2);
  assert.deepEqual(
    showGraph.dmx.universes.map((entry) => entry.id),
    [1, 2],
  );
  assert.equal(showGraph.dmx.fixtureModes.length, 1);
  assert.ok(showGraph.attributesCatalog.some((attribute) => attribute.id === 'intensity.dimmer'));
});
