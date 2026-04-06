export interface EnergyBands {
  low: number;
  mid: number;
  high: number;
}

export interface AudioCalibration {
  /**
   * Higher values make beat/onset detection react more aggressively.
   */
  sensitivity: number;
  /**
   * Exponential moving average coefficient for band smoothing.
   */
  smoothing: number;
  /**
   * Minimum low-band energy required before a beat can fire.
   */
  gate: number;
}

export type AudioInputMode = 'local' | 'line-in' | 'silent';

export interface AudioSnapshot {
  spectrum: Float32Array;
  energyBands: EnergyBands;
  beatLevel: number;
  tempoEstimate: number | null;
  mode: AudioInputMode;
}

export type BeatEventHandler = (intensity: number) => void;
export type EnergyBandsEventHandler = (bands: EnergyBands) => void;
export type TempoEstimateEventHandler = (tempoEstimate: number | null) => void;
