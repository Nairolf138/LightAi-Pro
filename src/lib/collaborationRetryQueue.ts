import { observability } from './observability';

export interface RetryWriteJob<TPayload> {
  idempotencyKey: string;
  entityType: 'cue' | 'patch' | 'preset';
  payload: TPayload;
  attempt: number;
  nextAttemptAt: number;
}

export class CollaborationRetryQueue<TPayload> {
  private queue: RetryWriteJob<TPayload>[] = [];

  enqueue(entityType: RetryWriteJob<TPayload>['entityType'], idempotencyKey: string, payload: TPayload): void {
    if (this.queue.some((job) => job.idempotencyKey === idempotencyKey)) {
      return;
    }

    this.queue.push({
      idempotencyKey,
      entityType,
      payload,
      attempt: 0,
      nextAttemptAt: Date.now(),
    });
  }

  pending(): RetryWriteJob<TPayload>[] {
    return [...this.queue];
  }

  async flush(writer: (job: RetryWriteJob<TPayload>) => Promise<void>): Promise<void> {
    const remaining: RetryWriteJob<TPayload>[] = [];

    for (const job of this.queue) {
      if (Date.now() < job.nextAttemptAt) {
        remaining.push(job);
        continue;
      }

      try {
        await writer(job);
      } catch (error) {
        const nextAttempt = job.attempt + 1;
        const delayMs = Math.min(10_000, 250 * 2 ** nextAttempt);
        remaining.push({
          ...job,
          attempt: nextAttempt,
          nextAttemptAt: Date.now() + delayMs,
        });

        observability.warn('collaboration-retry', 'Write failed; queued for retry', {
          idempotencyKey: job.idempotencyKey,
          entityType: job.entityType,
          attempt: nextAttempt,
          delayMs,
          reason: error instanceof Error ? error.message : String(error),
        }, ['retry', 'network']);
      }
    }

    this.queue = remaining;
  }
}
