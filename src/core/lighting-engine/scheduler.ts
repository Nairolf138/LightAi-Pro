export interface FrameSchedulerDependencies {
  now: () => number;
  schedule: (cb: () => void, delayMs: number) => unknown;
  cancel: (token: unknown) => void;
}

export interface FrameSchedulerOptions {
  tickMs: number;
  onTick: (nowMs: number) => void;
  deps?: Partial<FrameSchedulerDependencies>;
}

const defaultDeps: FrameSchedulerDependencies = {
  now: () => Date.now(),
  schedule: (cb, delayMs) => setTimeout(cb, delayMs),
  cancel: (token) => clearTimeout(token as ReturnType<typeof setTimeout>),
};

/**
 * Fixed tick scheduler intentionally decoupled from React rendering.
 * It can be unit-tested by injecting fake clock/scheduler dependencies.
 */
export class FrameScheduler {
  private readonly tickMs: number;
  private readonly onTick: (nowMs: number) => void;
  private readonly deps: FrameSchedulerDependencies;
  private timerToken: unknown | null = null;
  private running = false;
  private nextTickAt = 0;

  constructor(options: FrameSchedulerOptions) {
    this.tickMs = Math.max(1, Math.floor(options.tickMs));
    this.onTick = options.onTick;
    this.deps = {
      ...defaultDeps,
      ...options.deps,
    };
  }

  start(startAtMs = this.deps.now()): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.nextTickAt = startAtMs + this.tickMs;
    this.scheduleNext();
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.timerToken !== null) {
      this.deps.cancel(this.timerToken);
      this.timerToken = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  step(nowMs = this.deps.now()): number {
    if (this.nextTickAt === 0) {
      this.nextTickAt = nowMs;
    }

    let tickCount = 0;
    while (nowMs >= this.nextTickAt) {
      this.onTick(this.nextTickAt);
      this.nextTickAt += this.tickMs;
      tickCount += 1;
    }

    return tickCount;
  }

  private scheduleNext(): void {
    if (!this.running) {
      return;
    }

    const nowMs = this.deps.now();
    this.step(nowMs);

    const delayMs = Math.max(0, this.nextTickAt - this.deps.now());
    this.timerToken = this.deps.schedule(() => this.scheduleNext(), delayMs);
  }
}
