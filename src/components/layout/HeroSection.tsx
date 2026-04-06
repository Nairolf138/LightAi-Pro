import { ChevronRight, Github, Maximize2 } from 'lucide-react';
import { VirtualStageCanvas } from './VirtualStageCanvas';
import { useAppState } from '../../context/AppStateContext';

export function HeroSection() {
  const {
    virtualStage: { showVirtualStage, toggleVirtualStage }
  } = useAppState();

  return (
    <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
      <div className="perspective-text mb-12">
        <h1 className="text-7xl font-bold mb-6 gradient-text">LightAI Pro — Contrôle lumière en évolution</h1>
        <p className="text-2xl text-gray-300 mb-8">
          Plateforme de contrôle lumière orientée timeline, protocoles live et collaboration cloud (fonctionnalités AR/VR expérimentales).
        </p>
      </div>
      <div className="flex justify-center gap-4 mb-12">
        <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors flex items-center card-3d">
          Try Demo <ChevronRight className="ml-2 w-5 h-5" />
        </button>
        <button className="border border-yellow-400 text-yellow-400 px-8 py-3 rounded-full font-semibold hover:bg-yellow-400/10 transition-colors flex items-center card-3d">
          <Github className="mr-2 w-5 h-5" /> View on GitHub
        </button>
      </div>

      <div className="relative">
        <button
          onClick={toggleVirtualStage}
          className="absolute -top-12 right-0 text-sm text-gray-400 hover:text-yellow-400 transition-colors flex items-center space-x-2"
        >
          <Maximize2 className="w-4 h-4" />
          <span>{showVirtualStage ? 'Hide Virtual Stage' : 'Show Virtual Stage'}</span>
        </button>
        <VirtualStageCanvas />
      </div>
    </div>
  );
}
