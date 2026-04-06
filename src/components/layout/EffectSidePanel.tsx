import { Settings } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { effects } from '../../lib/effects';
import { EffectHistoryList } from '../EffectHistoryList';
import { PresetManager } from '../PresetManager';

interface EffectSidePanelProps {
  onLoadPreset: (configuration: Record<string, unknown>) => void;
  onLoadConfiguration: (configuration: Record<string, unknown>) => void;
}

export function EffectSidePanel({ onLoadPreset, onLoadConfiguration }: EffectSidePanelProps) {
  const { profile, showEffectPanel, toggleEffectPanel, playback } = useAppState();

  if (!profile) {
    return null;
  }

  const currentEffect = effects[playback.currentEffect];

  return (
    <>
      {showEffectPanel && (
        <div className="fixed right-0 top-20 bottom-0 w-96 bg-black/90 backdrop-blur-lg p-6 shadow-xl transform transition-transform z-40">
          <div className="space-y-6">
            <PresetManager
              userId={profile.id}
              currentEffectName={currentEffect.name}
              currentConfiguration={currentEffect.configuration}
              onLoadPreset={onLoadPreset}
            />
            <EffectHistoryList userId={profile.id} onLoadConfiguration={onLoadConfiguration} />
          </div>
        </div>
      )}

      <button
        onClick={toggleEffectPanel}
        className="fixed right-6 top-24 bg-yellow-400 text-black p-3 rounded-full shadow-lg hover:bg-yellow-300 transition-colors z-50"
      >
        <Settings className="w-6 h-6" />
      </button>
    </>
  );
}
