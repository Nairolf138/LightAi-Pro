import type { CanonicalCue, CanonicalPalette, CanonicalShowModel } from '../../core/show/canonical';

export type EosObjectType = 'patch' | 'palette' | 'cue' | 'macro';

export interface EosBridgeWarning {
  code: 'TIMING_QUANTIZED' | 'UNSUPPORTED_FOLLOW' | 'UNMAPPED_FEATURE';
  scope: EosObjectType;
  objectId: string;
  detail: string;
}

export interface EosPatchObject {
  id: string;
  label: string;
  address: string;
  modeId: string;
}

export interface EosPaletteObject {
  id: string;
  category: CanonicalPalette['kind'];
  label: string;
  values: CanonicalPalette['values'];
}

export interface EosCueObject {
  id: string;
  number: string;
  label: string;
  upTimeTenths: number;
  downTimeTenths?: number;
  delayTenths?: number;
  parts: CanonicalCue['parts'];
}

export interface EosMacroObject {
  id: string;
  label: string;
  action: string;
}

export interface EosShowState {
  patch: EosPatchObject[];
  palettes: EosPaletteObject[];
  cues: EosCueObject[];
  macros: EosMacroObject[];
}

export interface EosBridgeExportResult {
  eos: EosShowState;
  warnings: EosBridgeWarning[];
  report: {
    quantizedTimings: number;
    unmappedFeatures: number;
  };
  outputPolicy: {
    copilotOnly: boolean;
    localDmxOutputEnabled: boolean;
    reason: string;
  };
}

export interface BridgeOptions {
  copilotOnly?: boolean;
}

const quantizeMsToTenths = (ms: number): number => Math.max(0, Math.round(ms / 100));
const tenthsToMs = (tenths: number | undefined): number | undefined => (tenths === undefined ? undefined : tenths * 100);

export const exportCanonicalShowToEos = (show: CanonicalShowModel, options: BridgeOptions = {}): EosBridgeExportResult => {
  const warnings: EosBridgeWarning[] = [];

  const patch: EosPatchObject[] = show.dmx.fixtures.map((fixture) => ({
    id: fixture.id,
    label: fixture.name,
    address: `${fixture.universe}/${fixture.address}`,
    modeId: fixture.modeId,
  }));

  const palettes: EosPaletteObject[] = show.palettes.map((palette) => ({
    id: palette.id,
    category: palette.kind,
    label: palette.name,
    values: palette.values,
  }));

  const cues: EosCueObject[] = show.cues.map((cue) => {
    const upTimeTenths = quantizeMsToTenths(cue.timing.inMs);
    const downTimeTenths = quantizeMsToTenths(cue.timing.outMs ?? 0);
    const delayTenths = quantizeMsToTenths(cue.timing.delayMs ?? 0);

    if (upTimeTenths * 100 !== cue.timing.inMs || (cue.timing.outMs !== undefined && downTimeTenths * 100 !== cue.timing.outMs)) {
      warnings.push({
        code: 'TIMING_QUANTIZED',
        scope: 'cue',
        objectId: cue.id,
        detail: 'Timing arrondi à 0.1s pour compatibilité Eos.',
      });
    }

    if (cue.timing.followMs !== undefined) {
      warnings.push({
        code: 'UNSUPPORTED_FOLLOW',
        scope: 'cue',
        objectId: cue.id,
        detail: 'followMs non mappable vers Eos cue timing natif.',
      });
    }

    return {
      id: cue.id,
      number: cue.number,
      label: cue.name,
      upTimeTenths,
      downTimeTenths,
      delayTenths,
      parts: cue.parts,
    };
  });

  const macros: EosMacroObject[] = [
    {
      id: 'macro-copilot-sync',
      label: 'LightAi Sync Pull',
      action: 'SYNC_CANONICAL_STATE',
    },
  ];

  const eosState: EosShowState = { patch, palettes, cues, macros };

  return {
    eos: eosState,
    warnings,
    report: {
      quantizedTimings: warnings.filter((warning) => warning.code === 'TIMING_QUANTIZED').length,
      unmappedFeatures: warnings.filter((warning) => warning.code !== 'TIMING_QUANTIZED').length,
    },
    outputPolicy: {
      copilotOnly: Boolean(options.copilotOnly),
      localDmxOutputEnabled: !options.copilotOnly,
      reason: options.copilotOnly
        ? 'Mode copilot-only: aucune sortie DMX locale, pilotage via bridge Eos uniquement.'
        : 'Sortie locale autorisée en parallèle du bridge Eos.',
    },
  };
};

export const importEosStateToCanonicalSync = (show: CanonicalShowModel, state: EosShowState): CanonicalShowModel => {
  const cueById = new Map(state.cues.map((cue) => [cue.id, cue]));

  return {
    ...show,
    dmx: {
      ...show.dmx,
      fixtures: state.patch.map((fixture) => {
        const [universeToken, addressToken] = fixture.address.split('/');
        return {
          id: fixture.id,
          name: fixture.label,
          fixtureType: show.dmx.fixtures.find((entry) => entry.id === fixture.id)?.fixtureType ?? 'generic',
          modeId: fixture.modeId,
          universe: Number(universeToken),
          address: Number(addressToken),
        };
      }),
    },
    palettes: state.palettes.map((palette) => ({
      id: palette.id,
      name: palette.label,
      kind: palette.category,
      values: palette.values,
    })),
    cues: show.cues.map((cue) => {
      const eosCue = cueById.get(cue.id);
      if (!eosCue) {
        return cue;
      }

      return {
        ...cue,
        name: eosCue.label,
        number: eosCue.number,
        timing: {
          inMs: tenthsToMs(eosCue.upTimeTenths) ?? cue.timing.inMs,
          outMs: tenthsToMs(eosCue.downTimeTenths),
          delayMs: tenthsToMs(eosCue.delayTenths),
        },
        parts: eosCue.parts,
      };
    }),
  };
};
