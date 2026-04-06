import { AlertTriangle, Download, Shield } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

export function DiagnosticsPanel() {
  const { diagnostics } = useAppState();

  if (!diagnostics.isOpen) {
    return null;
  }

  const { snapshot, runtimeStatus } = diagnostics;

  return (
    <aside className="fixed left-6 top-24 bottom-6 w-[28rem] bg-black/90 border border-yellow-400/40 rounded-xl p-5 overflow-auto z-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-yellow-300">Diagnostics</h2>
        <button onClick={diagnostics.toggle} className="text-sm text-gray-300 hover:text-white">Fermer</button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="bg-gray-900/80 rounded-lg p-3">
          <div>Session: <span className="text-yellow-300">{snapshot.sessionId}</span></div>
          <div>Show: <span className="text-yellow-300">{snapshot.showId}</span></div>
          <div>MAJ: <span className="text-gray-300">{new Date(snapshot.updatedAt).toLocaleString()}</span></div>
        </div>

        <div className="bg-gray-900/80 rounded-lg p-3 space-y-1">
          <div className="font-medium">Runtime</div>
          <div>Ready: {runtimeStatus.ready ? 'yes' : 'no'}</div>
          <div>Protocol: {runtimeStatus.protocol ?? 'none'}</div>
          <div>Queue: {runtimeStatus.metrics.protocolQueueDepth}</div>
          <div>Queue max: {runtimeStatus.metrics.protocolQueueHighWatermark}</div>
          <div>Dropped protocol frames: {runtimeStatus.metrics.protocolDroppedFrames}</div>
        </div>

        <div className="bg-gray-900/80 rounded-lg p-3 space-y-1">
          <div className="font-medium">Frame Metrics</div>
          <div>Latency avg: {snapshot.metrics.frameLatencyMsAvg} ms</div>
          <div>Latency p95: {snapshot.metrics.frameLatencyMsP95} ms</div>
          <div>Dropped frames: {snapshot.metrics.droppedFrames}</div>
          <div>Total frames: {snapshot.metrics.totalFrames}</div>
        </div>

        <div className="bg-gray-900/80 rounded-lg p-3">
          <div className="font-medium mb-2">Derniers logs</div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {snapshot.logs.slice(0, 20).map((log) => (
              <div key={log.id} className="border border-gray-700 rounded-md p-2">
                <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()} • {log.level} • {log.module}</div>
                <div>{log.message}</div>
              </div>
            ))}
            {snapshot.logs.length === 0 && <div className="text-gray-400">Aucun log enregistré.</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2">
          <button
            onClick={() => diagnostics.exportIncidentReport('private')}
            className="bg-yellow-400 text-black rounded-lg px-3 py-2 font-semibold hover:bg-yellow-300 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export incident (privé)
          </button>
          <button
            onClick={() => diagnostics.exportIncidentReport('public')}
            className="bg-gray-100 text-black rounded-lg px-3 py-2 font-semibold hover:bg-white flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" /> Export incident (public, masqué)
          </button>
        </div>

        <div className="text-xs text-amber-300/90 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          Le mode public masque automatiquement les champs sensibles (token, secret, email, key, user_id...).
        </div>
      </div>
    </aside>
  );
}
