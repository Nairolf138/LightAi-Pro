import type { CanonicalCueTiming, CanonicalShowModel } from './canonical';

export type BriefEnergyLevel = 'low' | 'medium' | 'high' | 'peak';
export type BriefStyle = 'cinematic' | 'club' | 'concert' | 'ambient' | 'theater' | 'hybrid';
export type BriefVersion = 'safe' | 'balanced' | 'creative';

export interface StructuredBriefConstraint {
  avoidStrobe?: boolean;
  avoidBlackout?: boolean;
  maxIntensityPercent?: number;
  minTransitionMs?: number;
  maxCueCount?: number;
  requiresSmoothTransitions?: boolean;
}

export interface StructuredBriefMoment {
  id: string;
  label: string;
  atMs: number;
  energy: BriefEnergyLevel;
  purpose?: 'intro' | 'build' | 'drop' | 'break' | 'finale' | 'transition';
  transitionHint?: 'snap' | 'fade' | 'crossfade';
}

export interface StructuredBrief {
  style: BriefStyle;
  energy: {
    baseline: BriefEnergyLevel;
    targetPeak: BriefEnergyLevel;
  };
  tempo: {
    bpm: number;
    syncOnBeat: boolean;
  };
  keyMoments: StructuredBriefMoment[];
  constraints: StructuredBriefConstraint;
}

export interface LightingIntent {
  id: string;
  label: string;
  atMs: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  energy: BriefEnergyLevel;
  transition: CanonicalCueTiming;
  safety: {
    maxIntensityPercent: number;
    strobeAllowed: boolean;
    blackoutAllowed: boolean;
  };
}

export interface CueCandidate {
  id: string;
  name: string;
  atMs: number;
  transition: CanonicalCueTiming;
  priority: number;
  safetyPriority: number;
}

export interface FeasibilityBreakdown {
  score: number;
  coverage: {
    intensity: number;
    color: number;
    position: number;
    beam: number;
  };
  limitingFactors: string[];
}

export interface CueVersionPlan {
  version: BriefVersion;
  explanation: string;
  cues: CueCandidate[];
}

export interface BriefPlanningResult {
  brief: StructuredBrief;
  intentions: LightingIntent[];
  versions: CueVersionPlan[];
  feasibility: FeasibilityBreakdown;
}

const energyRank: Record<BriefEnergyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  peak: 4,
};

const energyToIntensity = (energy: BriefEnergyLevel): number => {
  switch (energy) {
    case 'low':
      return 35;
    case 'medium':
      return 60;
    case 'high':
      return 80;
    case 'peak':
      return 95;
  }
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const normalizeTransition = (
  atMs: number,
  energy: BriefEnergyLevel,
  hint: StructuredBriefMoment['transitionHint'],
  constraints: StructuredBriefConstraint,
): CanonicalCueTiming => {
  const beatMs = 60000 / 128;
  const minTransitionMs = constraints.minTransitionMs ?? 250;
  const quick = clamp(Math.round(beatMs), minTransitionMs, 2500);
  const smooth = clamp(Math.round(beatMs * 2), minTransitionMs, 5000);

  if (hint === 'snap') {
    return { delayMs: atMs, inMs: minTransitionMs, outMs: quick };
  }

  if (hint === 'fade' || constraints.requiresSmoothTransitions) {
    return { delayMs: atMs, inMs: smooth, outMs: smooth, followMs: smooth };
  }

  const inMs = energyRank[energy] >= 3 ? quick : smooth;
  return { delayMs: atMs, inMs, outMs: smooth, followMs: quick };
};

export const buildStructuredBrief = (input: Partial<StructuredBrief> & { style: BriefStyle }): StructuredBrief => {
  const keyMoments = [...(input.keyMoments ?? [])].sort((a, b) => a.atMs - b.atMs);

  return {
    style: input.style,
    energy: {
      baseline: input.energy?.baseline ?? 'medium',
      targetPeak: input.energy?.targetPeak ?? 'high',
    },
    tempo: {
      bpm: clamp(input.tempo?.bpm ?? 128, 60, 200),
      syncOnBeat: input.tempo?.syncOnBeat ?? true,
    },
    keyMoments,
    constraints: {
      avoidStrobe: input.constraints?.avoidStrobe ?? true,
      avoidBlackout: input.constraints?.avoidBlackout ?? false,
      maxIntensityPercent: input.constraints?.maxIntensityPercent ?? 90,
      minTransitionMs: input.constraints?.minTransitionMs ?? 250,
      maxCueCount: input.constraints?.maxCueCount,
      requiresSmoothTransitions: input.constraints?.requiresSmoothTransitions ?? false,
    },
  };
};

export const convertBriefToIntentions = (brief: StructuredBrief): LightingIntent[] =>
  brief.keyMoments.map((moment, index) => {
    const transition = normalizeTransition(moment.atMs, moment.energy, moment.transitionHint, brief.constraints);
    const isCriticalMoment = moment.purpose === 'drop' || moment.purpose === 'finale' || moment.energy === 'peak';

    return {
      id: `intent-${index + 1}`,
      label: `${moment.label} (${moment.purpose ?? 'moment'})`,
      atMs: moment.atMs,
      priority: isCriticalMoment ? 'critical' : energyRank[moment.energy] >= 3 ? 'high' : 'normal',
      energy: moment.energy,
      transition,
      safety: {
        maxIntensityPercent: Math.min(
          energyToIntensity(moment.energy),
          brief.constraints.maxIntensityPercent ?? 100,
        ),
        strobeAllowed: !brief.constraints.avoidStrobe && moment.energy === 'peak',
        blackoutAllowed: !brief.constraints.avoidBlackout && isCriticalMoment,
      },
    };
  });

const withVersionTuning = (intentions: LightingIntent[], version: BriefVersion): CueCandidate[] => {
  const tuning = {
    safe: { intensityFactor: 0.85, extraFollowMs: 400, safetyBias: 3 },
    balanced: { intensityFactor: 1, extraFollowMs: 250, safetyBias: 2 },
    creative: { intensityFactor: 1.1, extraFollowMs: 120, safetyBias: 1 },
  }[version];

  return intentions.map((intent, index) => ({
    id: `${version}-cue-${index + 1}`,
    name: `${version.toUpperCase()} · ${intent.label}`,
    atMs: intent.atMs,
    transition: {
      ...intent.transition,
      followMs: Math.max(0, (intent.transition.followMs ?? 0) + tuning.extraFollowMs),
      inMs: Math.max(100, Math.round(intent.transition.inMs * (2 - tuning.intensityFactor))),
    },
    priority: intent.priority === 'critical' ? 100 : intent.priority === 'high' ? 75 : 50,
    safetyPriority: intent.safety.strobeAllowed ? tuning.safetyBias : tuning.safetyBias + 2,
  }));
};

const capRatio = (supported: number, total: number): number => (total === 0 ? 0 : clamp(supported / total, 0, 1));

export const scoreTechnicalFeasibility = (
  patch: Pick<CanonicalShowModel, 'dmx' | 'attributesCatalog'>,
  brief: StructuredBrief,
): FeasibilityBreakdown => {
  const fixtureByMode = new Map(patch.dmx.fixtureModes.map((mode) => [mode.id, mode]));
  const totalFixtures = patch.dmx.fixtures.length;
  const attributeFamilies = new Map(patch.attributesCatalog.map((attr) => [attr.id, attr.family]));

  let intensityCount = 0;
  let colorCount = 0;
  let positionCount = 0;
  let beamCount = 0;

  for (const fixture of patch.dmx.fixtures) {
    const mode = fixtureByMode.get(fixture.modeId);
    if (!mode) {
      continue;
    }

    const families = new Set(
      mode.attributes
        .map((attr) => attributeFamilies.get(attr.attributeId))
        .filter((family): family is NonNullable<typeof family> => Boolean(family)),
    );

    if (families.has('dimmer')) intensityCount += 1;
    if (families.has('color')) colorCount += 1;
    if (families.has('position')) positionCount += 1;
    if (families.has('beam')) beamCount += 1;
  }

  const coverage = {
    intensity: capRatio(intensityCount, totalFixtures),
    color: capRatio(colorCount, totalFixtures),
    position: capRatio(positionCount, totalFixtures),
    beam: capRatio(beamCount, totalFixtures),
  };

  const styleWeight =
    brief.style === 'club'
      ? { intensity: 0.3, color: 0.3, position: 0.2, beam: 0.2 }
      : brief.style === 'theater'
      ? { intensity: 0.35, color: 0.15, position: 0.35, beam: 0.15 }
      : { intensity: 0.3, color: 0.25, position: 0.3, beam: 0.15 };

  let score =
    coverage.intensity * styleWeight.intensity +
    coverage.color * styleWeight.color +
    coverage.position * styleWeight.position +
    coverage.beam * styleWeight.beam;

  if ((brief.constraints.maxIntensityPercent ?? 100) < 70) {
    score -= 0.08;
  }

  if (brief.constraints.avoidStrobe) {
    score += 0.04;
  }

  const limitingFactors: string[] = [];
  if (coverage.intensity < 0.5) limitingFactors.push('Faible couverture dimmer (intensity).');
  if (coverage.color < 0.5) limitingFactors.push('Parc peu équipé en couleur.');
  if (coverage.position < 0.4) limitingFactors.push('Mouvements limités (pan/tilt).');
  if (coverage.beam < 0.3) limitingFactors.push('Capacités beam réduites (zoom/iris/gobo).');

  return {
    score: Math.round(clamp(score, 0, 1) * 100),
    coverage,
    limitingFactors,
  };
};

export const buildCueVersions = (intentions: LightingIntent[]): CueVersionPlan[] => [
  {
    version: 'safe',
    explanation: 'Priorise des transitions plus longues et des marges de sécurité élevées.',
    cues: withVersionTuning(intentions, 'safe'),
  },
  {
    version: 'balanced',
    explanation: 'Compromis entre lisibilité scénique, énergie et robustesse opérationnelle.',
    cues: withVersionTuning(intentions, 'balanced'),
  },
  {
    version: 'creative',
    explanation: 'Accentue le contraste des moments clés et réduit les temps de réaction visuels.',
    cues: withVersionTuning(intentions, 'creative'),
  },
];

export const planFromBrief = (
  input: Partial<StructuredBrief> & { style: BriefStyle },
  patch: Pick<CanonicalShowModel, 'dmx' | 'attributesCatalog'>,
): BriefPlanningResult => {
  const brief = buildStructuredBrief(input);
  const intentions = convertBriefToIntentions(brief);
  const maxCueCount = brief.constraints.maxCueCount;
  const filteredIntentions =
    typeof maxCueCount === 'number' ? intentions.slice(0, Math.max(1, maxCueCount)) : intentions;

  return {
    brief,
    intentions: filteredIntentions,
    versions: buildCueVersions(filteredIntentions),
    feasibility: scoreTechnicalFeasibility(patch, brief),
  };
};
