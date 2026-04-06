import { Activity, Github, Lightbulb } from 'lucide-react';
import { UserMenu } from '../UserMenu';
import { useAppState } from '../../context/AppStateContext';

export function Navbar() {
  const { profile, openAuthModal, diagnostics } = useAppState();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-8 h-8 text-yellow-400 glow" />
          <span className="text-xl font-bold gradient-text">LightAI Pro</span>
        </div>
        <div className="flex items-center space-x-8">
          <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
          <a href="#technology" className="hover:text-yellow-400 transition-colors">Technology</a>
          <a href="#demo" className="hover:text-yellow-400 transition-colors">Demo</a>
          <a href="https://github.com" className="hover:text-yellow-400 transition-colors flex items-center">
            <Github className="mr-2 w-4 h-4" />
            GitHub
          </a>

          <button
            onClick={diagnostics.toggle}
            className="hover:text-yellow-400 transition-colors flex items-center"
          >
            <Activity className="mr-2 w-4 h-4" />
            Diagnostics
          </button>

          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <button
              onClick={openAuthModal}
              className="bg-yellow-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
