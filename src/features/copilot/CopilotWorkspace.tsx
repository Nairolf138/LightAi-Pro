import { useMemo, useReducer, useState } from 'react';

import { copilotReducer, initialCopilotState, type Variant } from './copilotState';

type ShortcutProfile = 'busking' | 'playback' | 'tech';

const shortcutPresets: Record<ShortcutProfile, { nextCue: string; blackout: string; safetyAck: string; flash: string }> = {
  busking: { nextCue: 'Space', blackout: 'B', safetyAck: 'Shift+Enter', flash: 'F' },
  playback: { nextCue: 'Enter', blackout: 'Ctrl+B', safetyAck: 'Ctrl+Enter', flash: 'Shift+F' },
  tech: { nextCue: 'N', blackout: 'Q', safetyAck: 'A', flash: 'S' },
};

export function CopilotWorkspace() {
  const [state, dispatch] = useReducer(copilotReducer, initialCopilotState);
  const [actor] = useState('operator.local');
  const [shortcutProfile, setShortcutProfile] = useState<ShortcutProfile>('busking');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [csvData, setCsvData] = useState('fixtureId,universe,address\nWash-1,1,1\nBeam-1,2,45');
  const [sceneIntensity, setSceneIntensity] = useState(65);
  const cues = state.versions[state.selectedVariant];

  const blockedReason = useMemo(() => state.requiresValidation ? 'Guardrail UX: validation explicite requise avant toute application au show.' : 'Validation faite, application autorisée.', [state.requiresValidation]);
  const shortcutMap = { ...shortcutPresets[shortcutProfile], ...overrides };
  const csvRows = useMemo(() => csvData.split('\n').filter(Boolean), [csvData]);
  const csvIssues = useMemo(() => {
    if (csvRows.length < 2) return ['CSV incomplet'];
    const dataRows = csvRows.slice(1);
    return dataRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.split(',').length < 3)
      .map(({ index }) => `Ligne ${index + 2}: colonnes manquantes`);
  }, [csvRows]);

  return (
    <section data-testid="copilot-workspace" className="space-y-6 rounded-xl border border-white/10 bg-black/30 p-4">
      <h2 className="text-2xl font-semibold">Live UI étendue</h2>
      <p>Aucune application directe au show sans validation explicite.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-cyan-400/30 p-3">
          <h3 className="font-semibold">Pages executors / submasters virtuels</h3>
          <ul className="text-sm">
            <li>• Executor page A/B (faders + touches GO)</li>
            <li>• Submasters FX, couleur, mouvements</li>
            <li>• Tracking visualisé en live</li>
          </ul>
        </article>
        <article className="rounded-lg border border-purple-400/30 p-3">
          <h3 className="font-semibold">Raccourcis clavier configurables</h3>
          <select value={shortcutProfile} onChange={(event) => setShortcutProfile(event.target.value as ShortcutProfile)} className="mt-2 w-full rounded bg-gray-900 p-1">
            <option value="busking">Busking</option>
            <option value="playback">Playback</option>
            <option value="tech">Tech</option>
          </select>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(shortcutMap).map(([action, value]) => (
              <label key={action} className="flex items-center justify-between gap-2">
                <span>{action}</span>
                <input value={value} onChange={(event) => setOverrides((prev) => ({ ...prev, [action]: event.target.value }))} className="w-28 rounded bg-gray-900 px-2" />
              </label>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-amber-400/30 p-3">
          <h3 className="font-semibold">Écran condensé unique</h3>
          <p className="text-sm">Cue list + masters + inhibiteurs + blackout + alertes safety.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded bg-gray-900 p-1">Cue: Intro 03</span>
            <span className="rounded bg-gray-900 p-1">Masters: 72%</span>
            <span className="rounded bg-gray-900 p-1">Inhibiteurs: 1 actif</span>
            <span className="rounded bg-red-900/60 p-1">Blackout armé</span>
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-white/10 p-3">
        <h3 className="font-semibold">Workflow patch opérateur</h3>
        <textarea value={csvData} onChange={(event) => setCsvData(event.target.value)} className="mt-2 h-24 w-full rounded bg-gray-900 p-2 font-mono text-xs" />
        <p className="mt-2 text-sm">Audit guidé: {csvIssues.length === 0 ? 'OK' : `${csvIssues.length} problème(s)`} · Suggestions: correction universe/adresse · Apply contrôlé.</p>
        {csvIssues.map((issue) => <p key={issue} className="text-xs text-amber-300">{issue}</p>)}
      </article>

      <article className="rounded-lg border border-white/10 p-3">
        <h3 className="font-semibold">Visualisation scène 2D symbolique</h3>
        <input type="range" min={0} max={100} value={sceneIntensity} onChange={(event) => setSceneIntensity(Number(event.target.value))} />
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-blue-900/40 p-2">Zone Jardin<br />Cue actif: Intro<br />Direction: ↗<br />Intensité: {sceneIntensity}%</div>
          <div className="rounded bg-violet-900/40 p-2">Zone Centre<br />Cue actif: Drop<br />Direction: ↑<br />Intensité: {Math.max(0, sceneIntensity - 18)}%</div>
          <div className="rounded bg-emerald-900/40 p-2">Zone Cour<br />Cue actif: Outro<br />Direction: ↘<br />Intensité: {Math.min(100, sceneIntensity + 10)}%</div>
        </div>
      </article>

      <textarea data-testid="brief-editor" value={state.brief} onChange={(event) => dispatch({ type: 'brief/update', payload: event.target.value })} className="h-24 w-full rounded bg-gray-900 p-2" />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => dispatch({ type: 'generation/mock' })}>Générer variantes</button>
        <button onClick={() => dispatch({ type: 'show/validate' })}>Valider avant application</button>
        {(['safe', 'balanced', 'creative'] as Variant[]).map((variant) => <button key={variant} onClick={() => dispatch({ type: 'variant/select', payload: variant })}>{variant}</button>)}
      </div>

      <p data-testid="guardrail-status">{blockedReason}</p>
      <div data-testid="diff-view" className="grid gap-3">
        {cues.map((cue) => (
          <article key={cue.id} className="rounded border border-white/10 p-3">
            <h3>{cue.label}</h3><p>Confiance: {Math.round(cue.confidence * 100)}%</p><p>Justification: {cue.reason}</p>
            <ul>{cue.changes.map((change) => <li key={`${cue.id}-${change.attributeBlock}`}>{change.attributeBlock}: <input defaultValue={change.after} className="ml-2 rounded bg-gray-900 px-1" /></li>)}</ul>
            <button onClick={() => dispatch({ type: 'cue/accept', payload: { cueId: cue.id, actor, why: 'Accepté avec édition immédiate' } })}>Accept</button>
            <button onClick={() => dispatch({ type: 'cue/reject', payload: { cueId: cue.id, actor, why: 'Trop risqué' } })}>Reject</button>
          </article>
        ))}
      </div>
      <button disabled={state.acceptedCueIds.length === 0} onClick={() => dispatch({ type: 'batch/merge', payload: { actor, why: 'Apply contrôlé validé' } })}>Merge accepted batch</button>
      <div data-testid="decision-history"><h4>Historique audit (qui/quand/quoi/pourquoi)</h4>{state.decisionHistory.map((entry) => <p key={entry.id}>{entry.actor} - {entry.action} - {entry.target} - {entry.why}</p>)}</div>
    </section>
  );
}
