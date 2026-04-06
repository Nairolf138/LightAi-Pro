import { MinusCircle, Pause, Play, PlusCircle, Sliders, Volume2, VolumeX } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { effects } from '../../lib/effects';

export function PlayerBar() {
  const { playback } = useAppState();
  const effect = effects[playback.currentEffect];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg p-6 z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={playback.togglePlay}
              className="bg-yellow-400 p-3 rounded-full hover:bg-yellow-300 transition-colors"
            >
              {playback.isPlaying ? (
                <Pause className="w-5 h-5 text-black" />
              ) : (
                <Play className="w-5 h-5 text-black" />
              )}
            </button>
            <div>
              <div className="font-semibold">Current Effect</div>
              <div className="text-yellow-400">{effect.name}</div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>00:00</span>
              <span>04:32</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${playback.currentTime}%`,
                  background: effect.color
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-6">
            <div className="flex items-center space-x-2">
              <button onClick={playback.toggleMute} className="text-gray-400 hover:text-yellow-400 transition-colors">
                {playback.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-2">
                <button onClick={playback.decreaseVolume} className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <MinusCircle className="w-4 h-4" />
                </button>
                <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${playback.volume}%` }} />
                </div>
                <button onClick={playback.increaseVolume} className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button className="text-gray-400 hover:text-yellow-400 transition-colors">
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
