import { useMemo, useState } from 'react';
import type { CollaborationConflict, GuidedMergeResolution } from '../lib/collaborationStrategy';

interface ConflictResolutionPanelProps<TState extends Record<string, unknown>> {
  conflict: CollaborationConflict<TState> | null;
  onResolve: (resolution: GuidedMergeResolution<TState>) => void;
}

export function ConflictResolutionPanel<TState extends Record<string, unknown>>({ conflict, onResolve }: ConflictResolutionPanelProps<TState>) {
  const [fieldChoices, setFieldChoices] = useState<Record<string, 'local' | 'remote'>>({});

  const lines = useMemo(() => {
    if (!conflict) return [];
    return conflict.conflictingFields.map((field) => ({
      field,
      local: JSON.stringify(conflict.localPatch[field as keyof TState] ?? null, null, 2),
      remote: JSON.stringify(conflict.remoteState[field as keyof TState] ?? null, null, 2),
    }));
  }, [conflict]);

  if (!conflict) return null;

  return (
    <section className="mt-4 rounded-lg border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-50">
      <h3 className="font-semibold">Conflit de collaboration détecté ({conflict.entityType})</h3>
      <p className="mt-1 opacity-90">Version locale {conflict.expectedVersion} vs distante {conflict.remoteVersion}. Choisissez champ par champ.</p>
      <div className="mt-3 space-y-3">
        {lines.map((line) => (
          <div key={line.field} className="rounded border border-amber-200/20 p-3">
            <div className="mb-2 font-medium">{line.field}</div>
            <div className="grid gap-2 md:grid-cols-2">
              <pre className="overflow-auto rounded bg-black/30 p-2 text-xs">{line.local}</pre>
              <pre className="overflow-auto rounded bg-black/30 p-2 text-xs">{line.remote}</pre>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-emerald-600 px-3 py-1" onClick={() => setFieldChoices((prev) => ({ ...prev, [line.field]: 'local' }))}>Garder local</button>
              <button className="rounded bg-slate-600 px-3 py-1" onClick={() => setFieldChoices((prev) => ({ ...prev, [line.field]: 'remote' }))}>Prendre distant</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-blue-600 px-3 py-1" onClick={() => onResolve({ fieldChoices })}>Appliquer merge guidé</button>
        <button className="rounded bg-red-700 px-3 py-1" onClick={() => onResolve({ fieldChoices: {}, fallbackToManual: true, manualPatch: {} })}>Fallback manuel</button>
      </div>
    </section>
  );
}
