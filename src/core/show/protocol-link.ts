import { observability } from '../../lib/observability';
import { SafetyMonitor, type SafetyValidationReport } from '../../runtime/safety-monitor';
import { LightingOutputRouter } from '../protocols/selector';
import type { ShowOutputConfig } from '../protocols/types';
import type { ShowState, Universe } from '../lighting-engine/types';
import type { TimelineSnapshot } from './types';

const parseUniverseKey = (key: string): { universeId: string; channel: number } => {
  const [universeId, channelAsString] = key.split(':');
  return { universeId, channel: Number(channelAsString) };
};

const snapshotToUniverses = (snapshot: TimelineSnapshot): Record<string, Universe> => {
  const universes: Record<string, Universe> = {};
  for (const [key, value] of Object.entries(snapshot.values)) {
    const { universeId, channel } = parseUniverseKey(key);
    const universe = universes[universeId] ?? { id: universeId, name: universeId, size: 512, channels: {} };
    universe.channels[channel] = Math.max(0, Math.min(255, Math.round(value)));
    universes[universeId] = universe;
  }
  return universes;
};

const snapshotToShowState = (snapshot: TimelineSnapshot, output: ShowOutputConfig): ShowState => ({ fixtures: {}, scenes: {}, cues: {}, activeCue: null, currentSceneId: snapshot.activeCueId, tick: 0, output, universes: snapshotToUniverses(snapshot) });

export class ShowProtocolLink {
  private readonly safetyMonitor = new SafetyMonitor();
  constructor(private readonly router: LightingOutputRouter) {}

  async configure(output: ShowOutputConfig): Promise<void> {
    this.safetyMonitor.setProfile({
      id: output.safety?.profileId,
      forbidStrobe: output.safety?.forbidStrobe,
      enforceBlackout: output.safety?.enforceBlackout,
      maxDeltaPerFrame: output.safety?.maxDeltaPerFrame,
      forbiddenAttributes: output.safety?.forbiddenAttributes ? [...output.safety.forbiddenAttributes] : [],
      zoneLimits: Object.entries(output.safety?.zoneIntensityMax ?? {}).map(([zoneId, maxIntensity]) => ({ zoneId, maxIntensity })),
    });
    await this.router.setConfiguration(output);
  }

  async sendSnapshot(snapshot: TimelineSnapshot, output: ShowOutputConfig): Promise<SafetyValidationReport> {
    const { safeValues, report } = this.safetyMonitor.validate({ values: snapshot.values, blackout: snapshot.blackout });
    const safeSnapshot: TimelineSnapshot = { ...snapshot, values: safeValues, blackout: report.level === 'block' ? true : snapshot.blackout };
    observability.info('safety-monitor', `validation ${report.level}`, { reason: report.reason, rules: report.triggeredRules, cueId: snapshot.activeCueId }, ['ai', 'safety']);
    await this.router.applyState(snapshotToShowState(safeSnapshot, output));
    return report;
  }
}
