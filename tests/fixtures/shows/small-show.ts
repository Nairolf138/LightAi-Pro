import type { CanonicalShowModel } from '../../../src/core/show/canonical';

export const smallShow: CanonicalShowModel = {
  schemaVersion: '1.0.0',
  metadata: { showId: 'small-show', title: 'Small Show' },
  dmx: {
    universes: [{ id: 1 }],
    fixtureModes: [{ id: 'mode-1', name: '8ch', dmxFootprint: 8, attributes: [] }],
    fixtures: [{ id: 'fx-1', name: 'Spot 1', fixtureType: 'spot', modeId: 'mode-1', universe: 1, address: 1 }],
  },
  attributesCatalog: [{ id: 'dimmer', family: 'dimmer', label: 'Dimmer' }],
  groups: [{ id: 'grp-1', name: 'All', fixtureIds: ['fx-1'] }],
  palettes: [{ id: 'pal-1', name: 'Open', kind: 'beam', values: [{ fixtureId: 'fx-1', attributes: [{ attributeId: 'dimmer', value: 100, scale: 'percent' }] }] }],
  cues: [{ id: 'cue-1', number: '1', name: 'Go', timing: { inMs: 155, outMs: 220, followMs: 300 }, parts: [{ id: 'part-1', targets: [{ fixtureId: 'fx-1', values: [{ attributeId: 'dimmer', value: 100, scale: 'percent' }] }] }] }],
  consoleMappings: [],
};
