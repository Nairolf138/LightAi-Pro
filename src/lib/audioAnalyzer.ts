import * as Tone from 'tone';

export class AudioAnalyzer {
  private analyzer: Tone.Analyser;
  private player: Tone.Player;
  private fft: Float32Array;

  constructor() {
    this.analyzer = new Tone.Analyser('fft', 2048);
    this.player = new Tone.Player().connect(this.analyzer);
    this.fft = new Float32Array(2048);
  }

  async loadAudio(url: string) {
    await Tone.start();
    await this.player.load(url);
  }

  play() {
    this.player.start();
  }

  pause() {
    this.player.stop();
  }

  getSpectrum(): Float32Array {
    return this.analyzer.getValue() as Float32Array;
  }

  getBeatDetection(): number {
    const spectrum = this.getSpectrum();
    let sum = 0;
    // Analyze low frequencies (bass) for beat detection
    for (let i = 0; i < 10; i++) {
      sum += Math.abs(spectrum[i]);
    }
    return sum / 10;
  }

  getFrequencyBands(): { low: number; mid: number; high: number } {
    const spectrum = this.getSpectrum();
    const bands = {
      low: 0,
      mid: 0,
      high: 0
    };

    // Calculate average energy in different frequency bands
    for (let i = 0; i < spectrum.length; i++) {
      if (i < spectrum.length / 3) {
        bands.low += Math.abs(spectrum[i]);
      } else if (i < (spectrum.length * 2) / 3) {
        bands.mid += Math.abs(spectrum[i]);
      } else {
        bands.high += Math.abs(spectrum[i]);
      }
    }

    const normalize = (val: number) => val / (spectrum.length / 3);
    return {
      low: normalize(bands.low),
      mid: normalize(bands.mid),
      high: normalize(bands.high)
    };
  }
}