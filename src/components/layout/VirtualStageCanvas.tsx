import { Command, Eye, Laptop2 } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { useVirtualStageCanvas } from '../../hooks/useVirtualStageCanvas';

export function VirtualStageCanvas() {
  const {
    virtualStage: { showVirtualStage }
  } = useAppState();
  const { canvasRef, presets, activePreset, nextPreset } = useVirtualStageCanvas(showVirtualStage);

  if (!showVirtualStage) {
    return null;
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" width={1280} height={720} />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-lg rounded-full px-4 py-2">
          <button onClick={nextPreset} className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
            {presets[activePreset]}
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button className="hover:text-yellow-400 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="hover:text-yellow-400 transition-colors">
            <Command className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-lg rounded-full px-4 py-2">
          <button className="hover:text-yellow-400 transition-colors">
            <Laptop2 className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">Preview Mode</span>
        </div>
      </div>
    </div>
  );
}
