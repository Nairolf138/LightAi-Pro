export type LiveSafetyScope = 'project' | 'session';

export interface LiveSafetyConfig {
  projectEnabled: boolean;
  sessionEnabled: boolean;
}

export type HighImpactAction = 'global_blackout' | 'overwrite_cues' | 'remap_patch';

export type GuardedAction = HighImpactAction | 'destructive_automatic' | 'runtime_push';

export interface SafetyDecision {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

export interface PreviewItem<TPayload> {
  suggestionId: string;
  payload: TPayload;
  before: unknown;
  after: unknown;
  diff: string;
  source: {
    model: string;
    ruleset: string;
  };
  createdAt: string;
}

export interface ValidationAuditEvent {
  suggestionId: string;
  outcome: 'validated' | 'rejected';
  operatorId: string;
  timestamp: string;
  source: {
    model: string;
    ruleset: string;
  };
  reason?: string;
}

export class LiveSafetyManager {
  private config: LiveSafetyConfig = { projectEnabled: false, sessionEnabled: false };

  enable(scope: LiveSafetyScope): void {
    if (scope === 'project') this.config.projectEnabled = true;
    if (scope === 'session') this.config.sessionEnabled = true;
  }

  disable(scope: LiveSafetyScope): void {
    if (scope === 'project') this.config.projectEnabled = false;
    if (scope === 'session') this.config.sessionEnabled = false;
  }

  isEnabled(): boolean {
    return this.config.projectEnabled || this.config.sessionEnabled;
  }

  canRun(action: GuardedAction): SafetyDecision {
    if (!this.isEnabled()) {
      return { allowed: true };
    }

    if (action === 'destructive_automatic') {
      return {
        allowed: false,
        reason: 'liveSafety blocks destructive automatic actions while enabled.'
      };
    }

    if (action === 'runtime_push') {
      return { allowed: true, requiresConfirmation: true };
    }

    return { allowed: true };
  }

  canRunHighImpact(action: HighImpactAction): SafetyDecision {
    if (!this.isEnabled()) {
      return { allowed: true };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      reason: `liveSafety requires explicit confirmation for high-impact action: ${action}.`
    };
  }
}

export class SuggestionPreviewQueue<TPayload> {
  private queue: Array<PreviewItem<TPayload>> = [];

  enqueue(item: PreviewItem<TPayload>): void {
    this.queue.push(item);
  }

  list(): Array<PreviewItem<TPayload>> {
    return [...this.queue];
  }

  dequeue(suggestionId: string): PreviewItem<TPayload> | null {
    const index = this.queue.findIndex((entry) => entry.suggestionId === suggestionId);
    if (index < 0) return null;
    const [item] = this.queue.splice(index, 1);
    return item;
  }
}

export class ValidationAuditLog {
  private events: ValidationAuditEvent[] = [];

  record(event: ValidationAuditEvent): void {
    this.events.push(event);
  }

  list(): ValidationAuditEvent[] {
    return [...this.events];
  }
}
