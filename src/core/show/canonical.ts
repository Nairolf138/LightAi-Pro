export type CanonicalValueScale = 'byte' | 'fine16' | 'degrees' | 'percent' | 'kelvin' | 'colorWheelSlot' | 'goboSlot';

export interface CanonicalAttributeValue {
  attributeId: string;
  value: number | string;
  scale: CanonicalValueScale;
}

export interface CanonicalFixtureMode {
  id: string;
  name: string;
  dmxFootprint: number;
  limitations?: {
    unsupportedAttributes?: string[];
    notes?: string[];
  };
  attributes: Array<{
    attributeId: string;
    channels: number[];
    coarseChannel: number;
    fineChannel?: number;
    resolutionBits?: 8 | 16;
    range?: { min: number; max: number };
    defaultValue?: number;
  }>;
}

export interface CanonicalFixture {
  id: string;
  name: string;
  fixtureType: string;
  manufacturer?: string;
  modeId: string;
  universe: number;
  address: number;
  tags?: string[];
}

export interface CanonicalGroup {
  id: string;
  name: string;
  fixtureIds: string[];
}

export interface CanonicalPalette {
  id: string;
  name: string;
  kind: 'color' | 'position' | 'beam' | 'intensity' | 'focus';
  values: Array<{
    fixtureId?: string;
    groupId?: string;
    attributes: CanonicalAttributeValue[];
  }>;
}

export interface CanonicalCuePart {
  id: string;
  label?: string;
  targets: Array<{
    fixtureId?: string;
    groupId?: string;
    values: CanonicalAttributeValue[];
    paletteRefs?: string[];
  }>;
}

export interface CanonicalCueTiming {
  inMs: number;
  outMs?: number;
  delayMs?: number;
  followMs?: number;
}

export interface CanonicalCue {
  id: string;
  number: string;
  name: string;
  timing: CanonicalCueTiming;
  parts: CanonicalCuePart[];
}

export interface CanonicalConsoleMapping {
  console: 'grandma3' | 'eos' | 'chamsys' | 'avista';
  naming: {
    groupPrefix?: string;
    palettePrefix?: string;
    cueListFormat?: string;
  };
  limitations: {
    maxUniverses?: number;
    maxFixturesPerGroup?: number;
    unsupportedFeatures?: string[];
  };
  granularity: {
    timing: 'ms' | '0.1s' | 'frames';
    values: '8bit' | '16bit' | 'mixed';
  };
  translations: Array<{
    canonical: string;
    consoleTerm: string;
    note?: string;
  }>;
}

export interface CanonicalShowModel {
  schemaVersion: '1.0.0';
  metadata: {
    showId: string;
    title: string;
    bpm?: number;
  };
  dmx: {
    universes: Array<{ id: number; name?: string; net?: number; subnet?: number }>;
    fixtureModes: CanonicalFixtureMode[];
    fixtures: CanonicalFixture[];
  };
  attributesCatalog: Array<{
    id: string;
    family: 'dimmer' | 'color' | 'position' | 'gobo' | 'beam' | 'focus';
    label: string;
  }>;
  groups: CanonicalGroup[];
  palettes: CanonicalPalette[];
  cues: CanonicalCue[];
  consoleMappings: CanonicalConsoleMapping[];
}
