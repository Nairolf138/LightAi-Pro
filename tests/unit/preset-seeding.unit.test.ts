import { FixtureProfileRegistry, FIXTURE_PROFILE_FORMAT_VERSION } from '../../src/core/fixtures';
import {
  applyNamingAssistant,
  createBaseCleanTemplate,
  createIterationExport,
  createValidatableDraft,
  finalizeValidatedDraft,
  generatePreShowCueStack,
  seedGroupsAndPalettes,
  type NamingAssistant,
} from '../../src/core/show/preset-seeding';
import { assert, test } from '../harness';

const createRegistry = (): FixtureProfileRegistry => {
  const registry = new FixtureProfileRegistry();
  registry.importProfiles([
    {
      format: FIXTURE_PROFILE_FORMAT_VERSION,
      manufacturer: 'Acme',
      model: 'Hybrid',
      profileId: 'hybrid-wash',
      modes: [
        {
          id: 'std',
          name: 'Standard',
          channels: [
            { key: 'dimmer', name: 'Dimmer', type: 'intensity', attribute: 'dimmer' },
            { key: 'red', name: 'Red', type: 'color', attribute: 'red' },
            { key: 'green', name: 'Green', type: 'color', attribute: 'green' },
            { key: 'blue', name: 'Blue', type: 'color', attribute: 'blue' },
            { key: 'pan', name: 'Pan', type: 'position', attribute: 'pan' },
            { key: 'tilt', name: 'Tilt', type: 'position', attribute: 'tilt' },
            { key: 'zoom', name: 'Zoom', type: 'beam', attribute: 'zoom' },
          ],
        },
      ],
    },
  ]);
  return registry;
};

test('seedGroupsAndPalettes crée les groupes initiaux et palettes basées capacités fixtures', () => {
  const registry = createRegistry();
  const seeded = seedGroupsAndPalettes(
    {
      dmx: {
        fixtures: [
          {
            id: 'fx-1',
            name: 'Front Wash Left',
            fixtureType: 'hybrid-wash',
            modeId: 'std',
            universe: 1,
            address: 1,
            tags: ['role:wash', 'zone:frontline'],
          },
        ],
      },
    },
    registry,
  );

  assert.ok(seeded.groups.length >= 4);
  assert.ok(seeded.groups.some((group) => group.axis === 'position' && group.name.includes('Front')));
  assert.ok(seeded.groups.some((group) => group.axis === 'scenicRole' && group.name.includes('Wash')));
  assert.ok(seeded.groups.some((group) => group.axis === 'zone' && group.name.includes('Frontline')));
  assert.ok(seeded.palettes.some((palette) => palette.kind === 'intensity'));
  assert.ok(seeded.palettes.some((palette) => palette.kind === 'color'));
  assert.ok(seeded.palettes.some((palette) => palette.kind === 'position'));
  assert.ok(seeded.palettes.some((palette) => palette.kind === 'beam'));
});

test('applyNamingAssistant nettoie les noms proposés par la couche LLM', async () => {
  const registry = createRegistry();
  const seeded = seedGroupsAndPalettes(
    {
      dmx: {
        fixtures: [
          {
            id: 'fx-1',
            name: 'Front Wash Left',
            fixtureType: 'hybrid-wash',
            modeId: 'std',
            universe: 1,
            address: 1,
          },
        ],
      },
    },
    registry,
  );

  const assistant: NamingAssistant = {
    suggestName: async ({ baseName }) => ({
      readableName: `Readable ${baseName}`,
      artisticVariants: [`Alt ${baseName}`],
      cleanedName: `Clean ${baseName}`,
    }),
  };

  const enriched = await applyNamingAssistant(seeded, assistant);
  assert.ok(enriched.groups.every((group) => group.name.startsWith('Clean ')));
  assert.ok(enriched.palettes.every((palette) => palette.name.startsWith('Clean ')));
});

test('finalizeValidatedDraft impose une validation manuelle complète', () => {
  const draft = createValidatableDraft({ groups: [], palettes: [] });
  draft.groups.push({
    id: 'grp-1',
    name: 'Group 1',
    fixtureIds: ['fx-1'],
    axis: 'zone',
    source: 'U1',
    status: 'pending',
  });

  assert.throws(() => finalizeValidatedDraft(draft), /Validation manuelle incomplète/u);

  draft.groups[0].status = 'approved';
  const finalized = finalizeValidatedDraft(draft);
  assert.equal(finalized.groups.length, 1);
});

test('createBaseCleanTemplate prépare groupes, palettes minimales, séquences et checklist', () => {
  const registry = createRegistry();
  const template = createBaseCleanTemplate(
    {
      dmx: {
        fixtures: [
          {
            id: 'fx-1',
            name: 'Front Wash Left',
            fixtureType: 'hybrid-wash',
            modeId: 'std',
            universe: 1,
            address: 1,
          },
        ],
      },
    },
    registry,
  );

  assert.ok(template.groups.length > 0);
  assert.ok(template.palettes.some((palette) => palette.kind === 'intensity'));
  assert.ok(template.testSequences.some((sequence) => sequence.id === 'seq-focus-check'));
  assert.ok(template.validationChecklist.some((item) => item.category === 'patch' && item.required));
});

test('generatePreShowCueStack génère automatiquement la stack de cues de pré-show', () => {
  const registry = createRegistry();
  const template = createBaseCleanTemplate(
    {
      dmx: {
        fixtures: [
          {
            id: 'fx-1',
            name: 'Front Wash Left',
            fixtureType: 'hybrid-wash',
            modeId: 'std',
            universe: 1,
            address: 1,
          },
        ],
      },
    },
    registry,
  );

  const stack = generatePreShowCueStack(template);
  assert.equal(stack.cues.length, 3);
  assert.equal(stack.entryCueId, 'pre-show-focus');
  assert.deepEqual(
    stack.cues.map((cue) => cue.name),
    ['Pre-show · Focus', 'Pre-show · Balance', 'Pre-show · Base look'],
  );
});

test("createIterationExport ajoute un versioning exploitable pour itérations rapides", () => {
  const exported = createIterationExport(
    { cues: ['pre-show-focus'] },
    { baseName: 'pre-show', versionTag: 'v2', now: new Date('2026-04-26T12:00:00.000Z') },
  );

  assert.equal(exported.versionId, 'v2-2026-04-26T12-00-00-000Z');
  assert.equal(exported.fileName, 'pre-show.v2-2026-04-26T12-00-00-000Z.json');
  assert.ok(exported.payload.includes('"cues"'));
});
