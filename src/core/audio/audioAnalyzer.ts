import * as Tone from 'tone';
import type {
  AudioCalibration,
  AudioInputMode,
  AudioSnapshot,
  BeatEventHandler,
  EnergyBands,
  EnergyBandsEventHandler,
  TempoEstimateEventHandler
} from './types';

const DEFAULT_CALIBRATION: AudioCalibration = {
  sensitivity: 0.8,
  smoothing: 0.6,
  gate: 0.12
};

const FFT_SIZE = 1024;
const MIN_BEAT_INTERVAL_MS = 180;
const MAX_BEAT_HISTORY = 8;
const SILENT_TICK_MS = 50;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizeDb = (db: number) => {
  // Tone FFT values are typically around [-140, 0] dB.
  return clamp01((db + 140) / 140);
};

export class AudioAnalyzer {
  private readonly analyzer: Tone.Analyser;
  private readonly player: Tone.Player;
  private readonly lineIn: Tone.UserMedia;

  private mode: AudioInputMode = 'silent';
  private calibration: AudioCalibration = { ...DEFAULT_CALIBRATION };
  private spectrum: Float32Array = new Float32Array(FFT_SIZE);
  private smoothedBands: EnergyBands = { low: 0, mid: 0, high: 0 };
  private beatLevel = 0;
  private tempoEstimate: number | null = null;

  private lastBeatAt = 0;
  private beatIntervals: number[] = [];

  private onBeatHandlers = new Set<BeatEventHandler>();
  private onEnergyBandsHandlers = new Set<EnergyBandsEventHandler>();
  private onTempoEstimateHandlers = new Set<TempoEstimateEventHandler>();

  private processRafId: number | null = null;
  private silentIntervalId: number | null = null;

  constructor() {
    this.analyzer = new Tone.Analyser('fft', FFT_SIZE);
    this.player = new Tone.Player();
    this.lineIn = new Tone.UserMedia();
    this.player.connect(this.analyzer);
  }

  async loadLocalSource(url: string) {
    await Tone.start();
    await this.player.load(url);
    this.player.toDestination();
    this.mode = 'local';
    this.stopLineIn();
    this.stopSilentFallback();
    this.ensureProcessing();
  }

  async useLineIn() {
    await Tone.start();
    if (!this.lineIn.state || this.lineIn.state !== 'started') {
      await this.lineIn.open();
    }

    this.player.stop();
    this.player.disconnect(this.analyzer);
    this.lineIn.disconnect();
    this.lineIn.connect(this.analyzer);

    this.mode = 'line-in';
    this.stopSilentFallback();
    this.ensureProcessing();
  }

  useSilentFallback() {
    this.player.stop();
    this.stopLineIn();
    this.mode = 'silent';
    this.spectrum = new Float32Array(FFT_SIZE);
    this.smoothedBands = { low: 0, mid: 0, high: 0 };
    this.beatLevel = 0;
    this.tempoEstimate = null;
    this.startSilentFallback();
  }

  play() {
    if (this.mode === 'local') {
      this.player.start();
      this.ensureProcessing();
    }
  }

  pause() {
    if (this.mode === 'local') {
      this.player.stop();
    }
  }

  setCalibration(partial: Partial<AudioCalibration>) {
    this.calibration = {
      sensitivity: partial.sensitivity ?? this.calibration.sensitivity,
      smoothing: partial.smoothing ?? this.calibration.smoothing,
      gate: partial.gate ?? this.calibration.gate
    };
  }

  getCalibration(): AudioCalibration {
    return { ...this.calibration };
  }

  onBeat(handler: BeatEventHandler) {
    this.onBeatHandlers.add(handler);
    return () => this.onBeatHandlers.delete(handler);
  }

  onEnergyBands(handler: EnergyBandsEventHandler) {
    this.onEnergyBandsHandlers.add(handler);
    return () => this.onEnergyBandsHandlers.delete(handler);
  }

  onTempoEstimate(handler: TempoEstimateEventHandler) {
    this.onTempoEstimateHandlers.add(handler);
    return () => this.onTempoEstimateHandlers.delete(handler);
  }

  getSpectrum(): Float32Array {
    return this.spectrum;
  }

  getFrequencyBands(): EnergyBands {
    return { ...this.smoothedBands };
  }

  getBeatDetection(): number {
    return this.beatLevel;
  }

  getTempoEstimate(): number | null {
    return this.tempoEstimate;
  }

  getSnapshot(): AudioSnapshot {
    return {
      spectrum: this.getSpectrum(),
      energyBands: this.getFrequencyBands(),
      beatLevel: this.getBeatDetection(),
      tempoEstimate: this.getTempoEstimate(),
      mode: this.mode
    };
  }

  dispose() {
    if (this.processRafId !== null) {
      cancelAnimationFrame(this.processRafId);
      this.processRafId = null;
    }
    this.stopSilentFallback();
    this.player.stop();
    this.player.dispose();
    this.stopLineIn();
    this.lineIn.dispose();
    this.analyzer.dispose();

    this.onBeatHandlers.clear();
    this.onEnergyBandsHandlers.clear();
    this.onTempoEstimateHandlers.clear();
  }

  private ensureProcessing() {
    if (this.processRafId !== null) {
      return;
    }

    const tick = () => {
      this.processAudioFrame();
      this.processRafId = requestAnimationFrame(tick);
    };

    this.processRafId = requestAnimationFrame(tick);
  }

  private processAudioFrame() {
    if (this.mode === 'silent') {
      return;
    }

    const rawSpectrum = this.analyzer.getValue() as Float32Array;
    this.spectrum = rawSpectrum;

    const bands = this.computeEnergyBands(rawSpectrum);
    this.smoothedBands = {
      low: this.smooth(this.smoothedBands.low, bands.low),
      mid: this.smooth(this.smoothedBands.mid, bands.mid),
      high: this.smooth(this.smoothedBands.high, bands.high)
    };

    this.emitEnergyBands(this.smoothedBands);
    this.detectBeat(this.smoothedBands.low);
  }

  private computeEnergyBands(spectrum: Float32Array): EnergyBands {
    let low = 0;
    let mid = 0;
    let high = 0;

    const third = Math.max(1, Math.floor(spectrum.length / 3));
    for (let i = 0; i < spectrum.length; i++) {
      const value = normalizeDb(spectrum[i]);
      if (i < third) {
        low += value;
      } else if (i < third * 2) {
        mid += value;
      } else {
        high += value;
      }
    }

    return {
      low: low / third,
      mid: mid / third,
      high: high / (spectrum.length - third * 2 || 1)
    };
  }

  private detectBeat(lowBandEnergy: number) {
    const now = performance.now();
    const baseline = (this.smoothedBands.low + this.smoothedBands.mid) / 2;
    const dynamicThreshold = Math.max(
      this.calibration.gate,
      baseline * (1 + this.calibration.sensitivity * 0.75)
    );

    const intensity = clamp01((lowBandEnergy - dynamicThreshold) * (1 + this.calibration.sensitivity));
    const beatTriggered = intensity > 0 && now - this.lastBeatAt >= MIN_BEAT_INTERVAL_MS;

    this.beatLevel = intensity;

    if (!beatTriggered) {
      return;
    }

    if (this.lastBeatAt > 0) {
      const interval = now - this.lastBeatAt;
      this.beatIntervals.push(interval);
      if (this.beatIntervals.length > MAX_BEAT_HISTORY) {
        this.beatIntervals.shift();
      }
      this.updateTempoEstimate();
    }

    this.lastBeatAt = now;
    this.emitBeat(intensity);
  }

  private updateTempoEstimate() {
    if (this.beatIntervals.length < 2) {
      return;
    }

    const sorted = [...this.beatIntervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const bpm = Math.round(clamp01((60000 / median) / 240) * 240);
    const bounded = Math.max(40, Math.min(220, bpm));

    this.tempoEstimate = this.tempoEstimate === null
      ? bounded
      : Math.round(this.tempoEstimate * 0.7 + bounded * 0.3);

    this.emitTempoEstimate(this.tempoEstimate);
  }

  private smooth(previous: number, next: number) {
    const alpha = clamp01(this.calibration.smoothing);
    return previous * alpha + next * (1 - alpha);
  }

  private emitBeat(intensity: number) {
    this.onBeatHandlers.forEach((handler) => handler(intensity));
  }

  private emitEnergyBands(bands: EnergyBands) {
    this.onEnergyBandsHandlers.forEach((handler) => handler({ ...bands }));
  }

  private emitTempoEstimate(tempoEstimate: number | null) {
    this.onTempoEstimateHandlers.forEach((handler) => handler(tempoEstimate));
  }

  private startSilentFallback() {
    this.stopSilentFallback();

    const neutral: EnergyBands = { low: 0, mid: 0, high: 0 };
    this.silentIntervalId = window.setInterval(() => {
      this.spectrum = new Float32Array(FFT_SIZE);
      this.smoothedBands = neutral;
      this.beatLevel = 0;
      this.tempoEstimate = null;

      this.emitEnergyBands(neutral);
      this.emitTempoEstimate(null);
    }, SILENT_TICK_MS);
  }

  private stopSilentFallback() {
    if (this.silentIntervalId === null) {
      return;
    }
    clearInterval(this.silentIntervalId);
    this.silentIntervalId = null;
  }

  private stopLineIn() {
    if (this.lineIn.state === 'started') {
      this.lineIn.close();
    }
    this.lineIn.disconnect();
    this.player.disconnect();
    this.player.connect(this.analyzer);
  }
}
