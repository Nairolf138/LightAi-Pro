export type SafetyValidationLevel = 'pass' | 'warn' | 'block';
export interface SafetyRuleHit { rule: string; reason: string }
export interface SafetyValidationReport { level: SafetyValidationLevel; reason: string; triggeredRules: SafetyRuleHit[] }
export interface SafetyZoneLimit { zoneId: string; maxIntensity: number; universes?: string[] }
export interface SafetyProfile { id: string; forbidStrobe: boolean; enforceBlackout: boolean; maxDeltaPerFrame: number; forbiddenAttributes: string[]; zoneLimits: SafetyZoneLimit[] }
export interface SafetyMonitorInput { values: Record<string, number>; blackout: boolean; attributeByKey?: Record<string, string>; universeZoneMap?: Record<string, string> }
const clamp = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));
const DEFAULT_PROFILE: SafetyProfile = { id: 'default', forbidStrobe: false, enforceBlackout: false, maxDeltaPerFrame: 80, forbiddenAttributes: [], zoneLimits: [] };
export class SafetyMonitor {
  private profile: SafetyProfile = DEFAULT_PROFILE;
  private previousValues: Record<string, number> = {};
  setProfile(profile?: Partial<SafetyProfile>): void { this.profile = { ...DEFAULT_PROFILE, ...profile, forbiddenAttributes: profile?.forbiddenAttributes ?? [], zoneLimits: profile?.zoneLimits ?? [] }; }
  validate(input: SafetyMonitorInput): { safeValues: Record<string, number>; report: SafetyValidationReport } {
    const nextValues: Record<string, number> = {}; const hits: SafetyRuleHit[] = [];
    for (const [key, value] of Object.entries(input.values)) {
      let next = clamp(value); const previous = this.previousValues[key] ?? 0; const delta = Math.abs(next - previous);
      if (delta > this.profile.maxDeltaPerFrame) { hits.push({ rule: 'ramp_limit', reason: `${key} delta ${delta} > ${this.profile.maxDeltaPerFrame}` }); next = previous + Math.sign(next - previous) * this.profile.maxDeltaPerFrame; }
      const attribute = input.attributeByKey?.[key]?.toLowerCase() ?? '';
      if (this.profile.forbidStrobe && attribute.includes('strobe') && next > 0) { hits.push({ rule: 'forbid_strobe', reason: `${key} blocked strobe attribute` }); next = 0; }
      if (this.profile.forbiddenAttributes.includes(attribute) && next > 0) { hits.push({ rule: 'forbidden_attribute', reason: `${key} blocked attribute ${attribute}` }); next = 0; }
      const [universeId] = key.split(':'); const zoneId = input.universeZoneMap?.[universeId] ?? universeId; const zoneRule = this.profile.zoneLimits.find((item) => item.zoneId === zoneId);
      if (zoneRule && next > zoneRule.maxIntensity) { hits.push({ rule: 'zone_intensity_max', reason: `${key} clamped to zone ${zoneId} max ${zoneRule.maxIntensity}` }); next = zoneRule.maxIntensity; }
      nextValues[key] = clamp(next);
    }
    const blackoutRequested = input.blackout || this.profile.enforceBlackout;
    const safeValues = blackoutRequested ? Object.fromEntries(Object.keys(nextValues).map((key) => [key, 0])) : nextValues;
    if (blackoutRequested) hits.push({ rule: 'blackout_rule', reason: 'blackout enforced by show/runtime state' });
    this.previousValues = { ...safeValues };
    const level: SafetyValidationLevel = blackoutRequested ? 'block' : hits.length > 0 ? 'warn' : 'pass';
    return { safeValues, report: { level, reason: hits[0]?.reason ?? 'frame validated', triggeredRules: hits } };
  }
}
