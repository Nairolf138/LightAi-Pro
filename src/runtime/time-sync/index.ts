export type TimecodeSourceKind = 'ltc' | 'mtc' | 'osc';
export type SyncStatus = 'locked' | 'degraded' | 'free-run';

export interface ExternalTimecodeFrame {
  source: TimecodeSourceKind;
  timeMs: number;
  receivedAtMs: number;
}

export interface SyncDiagnostics {
  driftMs: number;
  jitterMs: number;
  lockLossCount: number;
  resyncEvents: number;
}

export interface ClockSnapshot {
  nowMs: number;
  authority: 'internal' | TimecodeSourceKind;
  status: SyncStatus;
  locked: boolean;
  diagnostics: SyncDiagnostics;
  offsetMs: number;
}

export class TimeSyncClockAuthority {
  private externalSource: TimecodeSourceKind | null = null;
  private status: SyncStatus = 'free-run';
  private offsetMs = 0;
  private driftMs = 0;
  private smoothedDriftMs = 0;
  private jitterMs = 0;
  private lockLossCount = 0;
  private resyncEvents = 0;
  private readonly lockTimeoutMs: number;
  private readonly nowFn: () => number;
  private lastFrameAtMs: number | null = null;
  private lastFrameDriftMs: number | null = null;

  constructor(options?: { now?: () => number; lockTimeoutMs?: number }) {
    this.nowFn = options?.now ?? (() => Date.now());
    this.lockTimeoutMs = options?.lockTimeoutMs ?? 200;
  }

  lock(source: TimecodeSourceKind): void {
    this.externalSource = source;
    this.status = 'degraded';
  }

  unlock(): void {
    this.externalSource = null;
    this.status = 'free-run';
    this.lastFrameAtMs = null;
    this.lastFrameDriftMs = null;
  }

  setManualOffset(offsetMs: number): void {
    this.offsetMs = offsetMs;
  }

  ingestFrame(frame: ExternalTimecodeFrame): void {
    if (this.externalSource !== frame.source) {
      return;
    }

    const internalNow = this.nowFn();
    const rawDrift = frame.timeMs - internalNow;

    if (this.lastFrameDriftMs !== null) {
      const delta = rawDrift - this.lastFrameDriftMs;
      this.jitterMs = Math.max(this.jitterMs, Math.abs(delta));
    }

    this.lastFrameDriftMs = rawDrift;
    this.driftMs = rawDrift;
    this.smoothedDriftMs = rawDrift;

    this.lastFrameAtMs = frame.receivedAtMs;
    const wasLocked = this.status === 'locked';
    this.status = 'locked';
    if (!wasLocked) {
      this.resyncEvents += 1;
    }
  }

  tick(): void {
    if (!this.externalSource) {
      this.status = 'free-run';
      return;
    }

    if (this.lastFrameAtMs === null) {
      this.status = 'degraded';
      return;
    }

    const elapsed = this.nowFn() - this.lastFrameAtMs;
    if (elapsed > this.lockTimeoutMs && this.status === 'locked') {
      this.status = 'degraded';
      this.lockLossCount += 1;
      this.jitterMs = Math.max(this.jitterMs, elapsed - this.lockTimeoutMs);
    }
  }

  now(): number {
    this.tick();
    const internalNow = this.nowFn() + this.offsetMs;
    if (this.status === 'locked') {
      return internalNow + this.smoothedDriftMs;
    }
    return internalNow;
  }

  getSnapshot(): ClockSnapshot {
    this.tick();
    return {
      nowMs: this.now(),
      authority: this.externalSource ?? 'internal',
      status: this.status,
      locked: this.status === 'locked',
      offsetMs: this.offsetMs,
      diagnostics: {
        driftMs: this.driftMs,
        jitterMs: this.jitterMs,
        lockLossCount: this.lockLossCount,
        resyncEvents: this.resyncEvents,
      },
    };
  }
}
