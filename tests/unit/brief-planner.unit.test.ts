import { assert, test } from '../harness';
import {
  buildStructuredBrief,
  convertBriefToIntentions,
  planFromBrief,
  scoreTechnicalFeasibility,
  type StructuredBrief,
} from '../../src/core/show/brief-planner';
import type { CanonicalShowModel } from '../../src/core/show/canonical';

const fullPatch: Pick<CanonicalShowModel, 'dmx' | 'attributesCatalog'> = {
  dmx: {
    universes: [{ id: 1 }],
    fixtureModes: [
      {
        id: 'wash-mode',
        name: 'Wash',
        dmxFootprint: 10,
        attributes: [
          { attributeId: 'intensity.dimmer', channels: [1], coarseChannel: 1 },
          { attributeId: 'color.rgb', channels: [2, 3, 4], coarseChannel: 2 },
          { attributeId: 'position.pan', channels: [5], coarseChannel: 5 },
          { attributeId: 'beam.zoom', channels: [6], coarseChannel: 6 },
        ],
      },
    ],
    fixtures: [
      {
        id: 'fx-1',
        name: 'Wash 1',
        fixtureType: 'wash',
        modeId: 'wash-mode',
        universe: 1,
        address: 1,
      },
      {
        id: 'fx-2',
        name: 'Wash 2',
        fixtureType: 'wash',
        modeId: 'wash-mode',
        universe: 1,
        address: 20,
      },
    ],
  },
  attributesCatalog: [
    { id: 'intensity.dimmer', family: 'dimmer', label: 'Dimmer' },
    { id: 'color.rgb', family: 'color', label: 'Color' },
    { id: 'position.pan', family: 'position', label: 'Pan' },
    { id: 'beam.zoom', family: 'beam', label: 'Zoom' },
  ],
};

const limitedPatch: Pick<CanonicalShowModel, 'dmx' | 'attributesCatalog'> = {
  ...fullPatch,
  dmx: {
    ...fullPatch.dmx,
    fixtureModes: [
      {
        id: 'dimmer-mode',
        name: 'Dimmer',
        dmxFootprint: 1,
        attributes: [{ attributeId: 'intensity.dimmer', channels: [1], coarseChannel: 1 }],
      },
    ],
    fixtures: [
      {
        id: 'fx-d1',
        name: 'Dimmer 1',
        fixtureType: 'dimmer',
        modeId: 'dimmer-mode',
        universe: 1,
        address: 1,
      },
    ],
  },
};

const briefInput: Partial<StructuredBrief> & { style: StructuredBrief['style'] } = {
  style: 'concert',
  energy: { baseline: 'low', targetPeak: 'peak' },
  tempo: { bpm: 132, syncOnBeat: true },
  constraints: {
    avoidStrobe: true,
    maxIntensityPercent: 85,
    minTransitionMs: 300,
    maxCueCount: 2,
  },
  keyMoments: [
    { id: 'm1', label: 'Intro', atMs: 0, energy: 'low', purpose: 'intro', transitionHint: 'fade' },
    { id: 'm2', label: 'Drop', atMs: 30000, energy: 'peak', purpose: 'drop', transitionHint: 'snap' },
    { id: 'm3', label: 'Finale', atMs: 60000, energy: 'high', purpose: 'finale' },
  ],
};

test('buildStructuredBrief complète le format de brief structuré', () => {
  const brief = buildStructuredBrief({ style: 'club' });
  assert.equal(brief.style, 'club');
  assert.equal(brief.tempo.bpm, 128);
  assert.equal(brief.constraints.avoidStrobe, true);
});

test('convertBriefToIntentions génère intentions avec transitions + sécurité', () => {
  const brief = buildStructuredBrief(briefInput);
  const intentions = convertBriefToIntentions(brief);

  assert.equal(intentions.length, 3);
  assert.equal(intentions[1].priority, 'critical');
  assert.equal(intentions[1].safety.strobeAllowed, false);
  assert.ok((intentions[0].transition.inMs ?? 0) >= 300);
});

test('planFromBrief produit les versions safe/balanced/creative et limite cue count', () => {
  const result = planFromBrief(briefInput, fullPatch);

  assert.equal(result.intentions.length, 2);
  assert.deepEqual(
    result.versions.map((version) => version.version),
    ['safe', 'balanced', 'creative'],
  );
  assert.ok(result.versions[0].cues[0].safetyPriority > result.versions[2].cues[0].safetyPriority);
  assert.ok(result.feasibility.score > 0);
});

test('scoreTechnicalFeasibility baisse quand le patch réel est limité', () => {
  const brief = buildStructuredBrief(briefInput);
  const fullScore = scoreTechnicalFeasibility(fullPatch, brief);
  const limitedScore = scoreTechnicalFeasibility(limitedPatch, brief);

  assert.ok(fullScore.score > limitedScore.score);
  assert.ok(limitedScore.limitingFactors.length >= 1);
});
