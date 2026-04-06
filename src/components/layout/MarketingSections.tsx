import {
  Brain,
  Cpu,
  Glasses,
  Globe,
  Lightbulb,
  Lock,
  Network,
  Play,
  Sparkles,
  Wand2,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-8 h-8 text-yellow-400" />,
    title: 'AI-Powered Programming',
    description: 'Neural network-driven automation and pattern recognition for intelligent show programming'
  },
  {
    icon: <Glasses className="w-8 h-8 text-yellow-400" />,
    title: 'AR/VR Integration',
    description: 'Immersive programming environment with holographic controls and real-time visualization'
  },
  {
    icon: <Wand2 className="w-8 h-8 text-yellow-400" />,
    title: 'Smart Effects Engine',
    description: 'Dynamic effects generation with real-time music synchronization and beat detection'
  },
  {
    icon: <Network className="w-8 h-8 text-yellow-400" />,
    title: 'Distributed Processing',
    description: 'Multi-node computation for complex real-time calculations and rendering'
  },
  {
    icon: <Cpu className="w-8 h-8 text-yellow-400" />,
    title: 'GPU Acceleration',
    description: 'Hardware-accelerated processing for smooth control of massive fixture arrays'
  },
  {
    icon: <Globe className="w-8 h-8 text-yellow-400" />,
    title: 'Cloud Integration',
    description: 'Real-time collaboration and show synchronization across multiple venues'
  },
  {
    icon: <Lock className="w-8 h-8 text-yellow-400" />,
    title: 'Enterprise Security',
    description: 'Military-grade encryption and access control for mission-critical shows'
  },
  {
    icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
    title: 'Automated Effects',
    description: 'AI-generated lighting sequences based on music analysis and crowd response'
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    title: 'Real-time Processing',
    description: 'Ultra-low latency control system with predictive algorithms'
  }
];

export function MarketingSections() {
  return (
    <>
      <section id="features" className="py-20 px-4 clip-path-slant bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">Revolutionary Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-3d bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 hover:bg-gray-800/70 transition-all cursor-pointer"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="technology" className="py-20 px-4 bg-black relative overflow-hidden">
        <div className="absolute inset-0 matrix-bg opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">Cutting-Edge Technology</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80"
                alt="AI Technology"
                className="rounded-xl shadow-2xl transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Neural Processing Unit</h3>
                  <p>Advanced AI algorithms process lighting data in real-time</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Quantum-Inspired Processing</h3>
                <p className="text-gray-400">Next-generation algorithms for complex lighting calculations</p>
              </div>
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Distributed Computing</h3>
                <p className="text-gray-400">Multi-node processing for unlimited fixture control</p>
              </div>
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Neural Networks</h3>
                <p className="text-gray-400">Deep learning models for intelligent show programming</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-16 gradient-text">Experience the Future</h2>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800/50 backdrop-blur-lg group">
            <img
              src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80"
              alt="Live Demo"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors flex items-center mx-auto card-3d">
                  <Play className="mr-2 w-5 h-5" /> Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black/50 backdrop-blur-lg py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <Lightbulb className="w-6 h-6 text-yellow-400 glow" />
            <span className="text-lg font-bold gradient-text">LightAI Pro</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-yellow-400 transition-colors">Features</a>
            <a href="#technology" className="text-gray-400 hover:text-yellow-400 transition-colors">Technology</a>
            <a href="#demo" className="text-gray-400 hover:text-yellow-400 transition-colors">Demo</a>
            <a href="https://github.com" className="text-gray-400 hover:text-yellow-400 transition-colors">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Documentation</a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </>
  );
}
