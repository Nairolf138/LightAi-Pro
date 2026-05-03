import { useMemo, useReducer, useState } from 'react';

export type Variant = 'safe' | 'balanced' | 'creative';

type CueChange = { attributeBlock: string; before: string; after: string };
type CueSuggestion = { id: string; label: string; confidence: number; reason: string; impacts: { universes: string[]; fixtures: string[]; scenes: string[] }; changes: CueChange[] };
type Decision = { id: string; actor: string; at: string; target: string; action: 'accept' | 'reject' | 'merge'; why: string };

type CopilotState = { brief: string; versions: Record<Variant, CueSuggestion[]>; selectedVariant: Variant; acceptedCueIds: string[]; decisionHistory: Decision[]; requiresValidation: boolean };

type CopilotAction =
  | { type: 'brief/update'; payload: string }
  | { type: 'variant/select'; payload: Variant }
  | { type: 'generation/mock' }
  | { type: 'cue/accept'; payload: { cueId: string; actor: string; why: string } }
  | { type: 'cue/reject'; payload: { cueId: string; actor: string; why: string } }
  | { type: 'batch/merge'; payload: { actor: string; why: string } }
  | { type: 'show/validate' };

const mockCueSuggestions = (variant: Variant): CueSuggestion[] => [{ id: `${variant}-cue-1`, label: `${variant.toUpperCase()} Intro wash`, confidence: variant === 'safe' ? 0.91 : variant === 'balanced' ? 0.86 : 0.74, reason: 'Préserve la lisibilité du plateau tout en accompagnant la montée.', impacts: { universes: ['U1'], fixtures: ['Wash-1', 'Wash-2'], scenes: ['Intro'] }, changes: [{ attributeBlock: 'Intensity', before: '35%', after: variant === 'creative' ? '62%' : '50%' }, { attributeBlock: 'Color', before: 'Deep blue', after: variant === 'safe' ? 'Soft cyan' : 'Magenta/Blue' }] }, { id: `${variant}-cue-2`, label: `${variant.toUpperCase()} Drop accent`, confidence: variant === 'creative' ? 0.8 : 0.88, reason: 'Accentuation rythmique sur la rupture sans strobe continu.', impacts: { universes: ['U1', 'U2'], fixtures: ['Beam-1', 'Beam-2', 'Strobe-1'], scenes: ['Drop'] }, changes: [{ attributeBlock: 'Position', before: 'Center', after: 'Wide fan' }, { attributeBlock: 'Beam', before: 'Narrow', after: 'Medium' }] }];

export const initialCopilotState: CopilotState = { brief: '', versions: { safe: [], balanced: [], creative: [] }, selectedVariant: 'balanced', acceptedCueIds: [], decisionHistory: [], requiresValidation: true };

export const copilotReducer = (state: CopilotState, action: CopilotAction): CopilotState => {
  switch (action.type) {
    case 'brief/update': return { ...state, brief: action.payload };
    case 'variant/select': return { ...state, selectedVariant: action.payload };
    case 'generation/mock': return { ...state, versions: { safe: mockCueSuggestions('safe'), balanced: mockCueSuggestions('balanced'), creative: mockCueSuggestions('creative') }, acceptedCueIds: [], requiresValidation: true };
    case 'cue/accept': return { ...state, acceptedCueIds: state.acceptedCueIds.includes(action.payload.cueId) ? state.acceptedCueIds : [...state.acceptedCueIds, action.payload.cueId], decisionHistory: [...state.decisionHistory, { id: `decision-${state.decisionHistory.length + 1}`, actor: action.payload.actor, at: new Date().toISOString(), target: action.payload.cueId, action: 'accept', why: action.payload.why }] };
    case 'cue/reject': return { ...state, acceptedCueIds: state.acceptedCueIds.filter((id) => id !== action.payload.cueId), decisionHistory: [...state.decisionHistory, { id: `decision-${state.decisionHistory.length + 1}`, actor: action.payload.actor, at: new Date().toISOString(), target: action.payload.cueId, action: 'reject', why: action.payload.why }] };
    case 'batch/merge': return { ...state, decisionHistory: [...state.decisionHistory, { id: `decision-${state.decisionHistory.length + 1}`, actor: action.payload.actor, at: new Date().toISOString(), target: `batch:${state.selectedVariant}`, action: 'merge', why: action.payload.why }], requiresValidation: true };
    case 'show/validate': return { ...state, requiresValidation: false };
    default: return state;
  }
};

export function CopilotWorkspace() {
  const [state, dispatch] = useReducer(copilotReducer, initialCopilotState);
  const [actor] = useState('operator.local');
  const cues = state.versions[state.selectedVariant];
  const blockedReason = useMemo(() => state.requiresValidation ? 'Guardrail UX: validation explicite requise avant toute application au show.' : 'Validation faite, application autorisée.', [state.requiresValidation]);

  return <section data-testid="copilot-workspace"><h2>Copilot Workspace</h2><p>Aucune application directe au show sans validation explicite.</p><textarea data-testid="brief-editor" value={state.brief} onChange={(event) => dispatch({ type: 'brief/update', payload: event.target.value })} /><button onClick={() => dispatch({ type: 'generation/mock' })}>Générer variantes</button><button onClick={() => dispatch({ type: 'show/validate' })}>Valider avant application</button><div>{(['safe', 'balanced', 'creative'] as Variant[]).map((variant) => <button key={variant} onClick={() => dispatch({ type: 'variant/select', payload: variant })}>{variant}</button>)}</div><p data-testid="guardrail-status">{blockedReason}</p><div data-testid="diff-view">{cues.map((cue) => <article key={cue.id}><h3>{cue.label}</h3><p>Confiance: {Math.round(cue.confidence * 100)}%</p><p>Justification: {cue.reason}</p><p>Impacts: univers {cue.impacts.universes.join(', ')}, fixtures {cue.impacts.fixtures.join(', ')}, scènes {cue.impacts.scenes.join(', ')}</p><ul>{cue.changes.map((change) => <li key={`${cue.id}-${change.attributeBlock}`}>{change.attributeBlock}: <span>{change.before}</span> → <span>{change.after}</span></li>)}</ul><button onClick={() => dispatch({ type: 'cue/accept', payload: { cueId: cue.id, actor, why: 'Looks coherent' } })}>Accept</button><button onClick={() => dispatch({ type: 'cue/reject', payload: { cueId: cue.id, actor, why: 'Too risky' } })}>Reject</button></article>)}</div><button disabled={state.acceptedCueIds.length === 0} onClick={() => dispatch({ type: 'batch/merge', payload: { actor, why: 'Partial merge approved' } })}>Merge accepted batch</button><div data-testid="decision-history"><h4>Historique audit (qui/quand/quoi/pourquoi)</h4>{state.decisionHistory.map((entry) => <p key={entry.id}>{entry.actor} - {entry.action} - {entry.target} - {entry.why}</p>)}</div></section>;
}
