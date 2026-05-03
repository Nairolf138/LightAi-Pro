export interface SendFrameTask {
  universe: number;
  frame: ReadonlyArray<number>;
  criticalChannels?: ReadonlyArray<number>;
}

export interface BackpressureConfig {
  maxQueueDepth: number;
  throttleMs: number;
  criticalUniverses: ReadonlyArray<number>;
}

export interface BackpressureDecision {
  accepted: boolean;
  degraded: boolean;
  reason?: string;
}

export class FrameBackpressureController {
  private queue: SendFrameTask[] = [];
  private lastDispatchMs = 0;

  constructor(private readonly config: BackpressureConfig, private readonly now = () => Date.now()) {}

  enqueue(task: SendFrameTask): BackpressureDecision {
    if (this.queue.length >= this.config.maxQueueDepth) {
      if (this.isCritical(task)) {
        this.dropNonCritical();
      } else {
        return { accepted: false, degraded: true, reason: 'queue_saturated_drop_non_critical' };
      }
    }

    this.queue.push(task);
    return { accepted: true, degraded: false };
  }

  dequeueReady(): SendFrameTask | null {
    if (this.queue.length === 0) return null;
    const nowMs = this.now();
    if (nowMs - this.lastDispatchMs < this.config.throttleMs) return null;
    this.lastDispatchMs = nowMs;
    return this.queue.shift() ?? null;
  }

  private isCritical(task: SendFrameTask): boolean {
    return this.config.criticalUniverses.includes(task.universe) || Boolean(task.criticalChannels?.length);
  }

  private dropNonCritical(): void {
    const index = this.queue.findIndex((task) => !this.isCritical(task));
    if (index >= 0) this.queue.splice(index, 1);
  }
}
