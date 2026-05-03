import type { CanonicalShowModel } from '../../../src/core/show/canonical';

export const mediumShow: CanonicalShowModel = {
  schemaVersion: '1.0.0',
  metadata: { showId: 'medium-show', title: 'Medium Show', bpm: 128 },
  dmx: {
    universes: [{ id: 1 }, { id: 2 }],
    fixtureModes: [
      { id: 'mode-spot', name: '16ch', dmxFootprint: 16, attributes: [] },
      { id: 'mode-wash', name: '12ch', dmxFootprint: 12, attributes: [] },
    ],
    fixtures: [
      { id: 'fx-1', name: 'Spot 1', fixtureType: 'spot', modeId: 'mode-spot', universe: 1, address: 1 },
      { id: 'fx-2', name: 'Spot 2', fixtureType: 'spot', modeId: 'mode-spot', universe: 1, address: 17 },
      { id: 'fx-3', name: 'Wash 1', fixtureType: 'wash', modeId: 'mode-wash', universe: 2, address: 1 },
    ],
  },
  attributesCatalog: [
    { id: 'dimmer', family: 'dimmer', label: 'Dimmer' },
    { id: 'pan', family: 'position', label: 'Pan' },
  ],
  groups: [{ id: 'grp-1', name: 'Spots', fixtureIds: ['fx-1', 'fx-2'] }],
  palettes: [
    { id: 'pal-1', name: 'Bright', kind: 'intensity', values: [{ groupId: 'grp-1', attributes: [{ attributeId: 'dimmer', value: 100, scale: 'percent' }] }] },
  ],
  cues: [
    { id: 'cue-1', number: '1', name: 'Intro', timing: { inMs: 1200, outMs: 800 }, parts: [{ id: 'p1', targets: [{ groupId: 'grp-1', values: [{ attributeId: 'dimmer', value: 80, scale: 'percent' }] }] }] },
    { id: 'cue-2', number: '2', name: 'Build', timing: { inMs: 950, delayMs: 75 }, parts: [{ id: 'p2', targets: [{ fixtureId: 'fx-3', values: [{ attributeId: 'pan', value: 10, scale: 'degrees' }] }] }] },
  ],
  consoleMappings: [],
};
