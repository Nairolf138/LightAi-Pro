export type ObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ObservabilityLogEntry {
  id: string;
  timestamp: string;
  level: ObservabilityLevel;
  module: string;
  message: string;
  sessionId: string;
  showId: string;
  data?: Record<string, unknown>;
  tags?: string[];
  incidentSeverity?: 'sev1' | 'sev2' | 'sev3' | 'none';
}

export interface IncidentTimelineEvent {
  timestamp: string;
  phase: 'detected' | 'mitigating' | 'recovered' | 'postmortem';
  summary: string;
  details?: Record<string, unknown>;
}

export interface RuntimeMetricsSnapshot {
  frameLatencyMsAvg: number;
  frameLatencyMsP95: number;
  droppedFrames: number;
  totalFrames: number;
  protocolQueueDepth: number;
  protocolQueueHighWatermark: number;
  protocolDroppedFrames: number;
}

export interface ObservabilitySnapshot {
  sessionId: string;
  showId: string;
  logs: ObservabilityLogEntry[];
  metrics: RuntimeMetricsSnapshot;
  updatedAt: string;
}

const LOG_LIMIT = 400;
const LATENCY_SAMPLE_LIMIT = 240;

const randomId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const percentile = (samples: number[], p: number): number => {
  if (samples.length === 0) {
    return 0;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return Number(sorted[index].toFixed(2));
};

class ObservabilityStore {
  private readonly sessionId = randomId();
  private showId = 'default-show';
  private logs: ObservabilityLogEntry[] = [];
  private latencySamples: number[] = [];
  private droppedFrames = 0;
  private totalFrames = 0;
  private protocolQueueDepth = 0;
  private protocolQueueHighWatermark = 0;
  private protocolDroppedFrames = 0;
  private incidentTimeline: IncidentTimelineEvent[] = [];

  setShowId(showId: string): void {
    this.showId = showId;
  }

  log(
    level: ObservabilityLevel,
    module: string,
    message: string,
    data?: Record<string, unknown>,
    options?: { tags?: string[]; incidentSeverity?: 'sev1' | 'sev2' | 'sev3' | 'none' }
  ): void {
    const entry: ObservabilityLogEntry = {
      id: randomId(),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      sessionId: this.sessionId,
      showId: this.showId,
      data,
      tags: options?.tags,
      incidentSeverity: options?.incidentSeverity,
    };

    this.logs = [entry, ...this.logs].slice(0, LOG_LIMIT);

    if (level === 'error') {
      console.error('[OBS]', entry);
    } else if (level === 'warn') {
      console.warn('[OBS]', entry);
    } else {
      console.info('[OBS]', entry);
    }
  }

  addIncidentEvent(event: IncidentTimelineEvent): void {
    this.incidentTimeline = [event, ...this.incidentTimeline].slice(0, 120);
  }

  trackFrame(frameLatencyMs: number, dropped = false): void {
    this.totalFrames += 1;
    if (dropped) {
      this.droppedFrames += 1;
    }

    this.latencySamples = [...this.latencySamples, Math.max(0, frameLatencyMs)].slice(-LATENCY_SAMPLE_LIMIT);
  }

  setProtocolMetrics(metrics: {
    queueDepth: number;
    queueHighWatermark: number;
    droppedFrames: number;
  }): void {
    this.protocolQueueDepth = metrics.queueDepth;
    this.protocolQueueHighWatermark = metrics.queueHighWatermark;
    this.protocolDroppedFrames = metrics.droppedFrames;
  }

  snapshot(): ObservabilitySnapshot {
    const latencyAvg =
      this.latencySamples.length > 0
        ? Number(
            (
              this.latencySamples.reduce((total, sample) => total + sample, 0) / this.latencySamples.length
            ).toFixed(2),
          )
        : 0;

    return {
      sessionId: this.sessionId,
      showId: this.showId,
      logs: this.logs,
      metrics: {
        frameLatencyMsAvg: latencyAvg,
        frameLatencyMsP95: percentile(this.latencySamples, 0.95),
        droppedFrames: this.droppedFrames,
        totalFrames: this.totalFrames,
        protocolQueueDepth: this.protocolQueueDepth,
        protocolQueueHighWatermark: this.protocolQueueHighWatermark,
        protocolDroppedFrames: this.protocolDroppedFrames,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  getIncidentTimeline(): IncidentTimelineEvent[] {
    return this.incidentTimeline;
  }
}

const store = new ObservabilityStore();

export const observability = {
  setShowId: (showId: string) => store.setShowId(showId),
  debug: (module: string, message: string, data?: Record<string, unknown>, tags?: string[]) =>
    store.log('debug', module, message, data, { tags, incidentSeverity: 'none' }),
  info: (module: string, message: string, data?: Record<string, unknown>, tags?: string[]) =>
    store.log('info', module, message, data, { tags, incidentSeverity: 'none' }),
  warn: (module: string, message: string, data?: Record<string, unknown>, tags?: string[]) =>
    store.log('warn', module, message, data, { tags, incidentSeverity: 'sev3' }),
  error: (
    module: string,
    message: string,
    data?: Record<string, unknown>,
    severity: 'sev1' | 'sev2' | 'sev3' = 'sev2',
    tags?: string[]
  ) => store.log('error', module, message, data, { tags, incidentSeverity: severity }),
  incident: (phase: IncidentTimelineEvent['phase'], summary: string, details?: Record<string, unknown>) =>
    store.addIncidentEvent({ timestamp: new Date().toISOString(), phase, summary, details }),
  trackFrame: (frameLatencyMs: number, dropped = false) => store.trackFrame(frameLatencyMs, dropped),
  setProtocolMetrics: (metrics: {
    queueDepth: number;
    queueHighWatermark: number;
    droppedFrames: number;
  }) => store.setProtocolMetrics(metrics),
  snapshot: (): ObservabilitySnapshot => store.snapshot(),
};

const SENSITIVE_KEYS = [/password/i, /secret/i, /token/i, /authorization/i, /^key$/i, /email/i, /user[_-]?id/i];

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((matcher) => matcher.test(key))) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = sanitize(nested);
      }
    }
    return output;
  }

  return value;
};

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';

export const buildIncidentReport = (options: {
  exportScope: 'private' | 'public';
  runtimeStatus: unknown;
  appConfig: Record<string, unknown>;
}): string => {
  const snapshot = observability.snapshot();
  const payload = {
    generatedAt: new Date().toISOString(),
    scope: options.exportScope,
    appVersion: APP_VERSION,
    diagnostics: {
      ...snapshot,
      logs: options.exportScope === 'public' ? (sanitize(snapshot.logs) as ObservabilityLogEntry[]) : snapshot.logs,
      incidentTimeline:
        options.exportScope === 'public' ? (sanitize(store.getIncidentTimeline()) as IncidentTimelineEvent[]) : store.getIncidentTimeline(),
    },
    runtimeStatus: options.exportScope === 'public' ? sanitize(options.runtimeStatus) : options.runtimeStatus,
    config: options.exportScope === 'public' ? sanitize(options.appConfig) : options.appConfig,
  };

  return JSON.stringify(payload, null, 2);
};

export const downloadIncidentReport = (filename: string, report: string): void => {
  const blob = new Blob([report], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
