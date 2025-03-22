import React, { useState, useEffect, useRef } from 'react';
import { Brain, Lightbulb, Glasses, Wand2, Cloud, Waves, Microscope as Microphone, Share2, ChevronRight, Github, 
  Zap, Network, Cpu, Globe, Lock, Sparkles, Play, Pause, SkipForward, Music, Settings, Layout, 
  Maximize2, MinusCircle, PlusCircle, Volume2, VolumeX, Sliders, Eye, Command, Laptop2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase, type Profile } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { PresetManager } from './components/PresetManager';
import { EffectHistoryList } from './components/EffectHistoryList';
import { effects } from './lib/effects';
import toast from 'react-hot-toast';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEffect, setCurrentEffect] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [showVirtualStage, setShowVirtualStage] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showEffectPanel, setShowEffectPanel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const presets = [
    'Concert Hall',
    'Theater Stage',
    'Club Environment',
    'Outdoor Festival',
    'TV Studio'
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  };

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev + 1) % 100);
        if (currentTime % 20 === 0) {
          setCurrentEffect(prev => (prev + 1) % effects.length);
          if (profile) {
            logEffectUsage(effects[currentEffect].name, effects[currentEffect].configuration);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, profile]);

  const logEffectUsage = async (effectName: string, configuration: Record<string, any>) => {
    if (!profile) return;

    const { error } = await supabase
      .from('effect_history')
      .insert([{
        user_id: profile.id,
        effect_name: effectName,
        configuration
      }]);

    if (error) {
      console.error('Error logging effect usage:', error);
    }
  };

  const handleLoadPreset = (configuration: Record<string, any>) => {
    toast.success('Preset loaded');
  };

  const handleLoadConfiguration = (configuration: Record<string, any>) => {
    toast.success('Configuration loaded');
  };

  useEffect(() => {
    if (canvasRef.current && showVirtualStage) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const animate = () => {
        if (!showVirtualStage) return;

        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        
        // Draw stage
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, canvasRef.current!.height - 100, canvasRef.current!.width, 100);

        // Draw light beams
        const centerX = canvasRef.current!.width / 2;
        const colors = ['#FFD700', '#FF4500', '#FF1493', '#00FF7F', '#4169E1'];
        
        colors.forEach((color, i) => {
          const angle = (Math.sin(Date.now() / 1000 + i) * Math.PI) / 4;
          
          ctx.save();
          ctx.translate(centerX + (i - 2) * 100, 100);
          ctx.rotate(angle);
          
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, `${color}33`);
          gradient.addColorStop(0.5, `${color}66`);
          gradient.addColorStop(1, `${color}11`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.lineTo(20, 0);
          ctx.lineTo(40, 400);
          ctx.lineTo(-40, 400);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        });

        requestAnimationFrame(animate);
      };

      animate();
    }
  }, [showVirtualStage]);

  const renderVirtualStage = () => (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width={1280}
        height={720}
      />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-lg rounded-full px-4 py-2">
          <button
            onClick={() => setActivePreset((prev) => (prev + 1) % presets.length)}
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <Toaster position="top-right" />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {profile && showEffectPanel && (
        <div className="fixed right-0 top-20 bottom-0 w-96 bg-black/90 backdrop-blur-lg p-6 shadow-xl transform transition-transform z-40">
          <div className="space-y-6">
            <PresetManager
              userId={profile.id}
              currentConfiguration={effects[currentEffect].configuration}
              onLoadPreset={handleLoadPreset}
            />
            <EffectHistoryList
              userId={profile.id}
              onLoadConfiguration={handleLoadConfiguration}
            />
          </div>
        </div>
      )}

      {profile && (
        <button
          onClick={() => setShowEffectPanel(!showEffectPanel)}
          className="fixed right-6 top-24 bg-yellow-400 text-black p-3 rounded-full shadow-lg hover:bg-yellow-300 transition-colors z-50"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 matrix-bg opacity-20" />
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            className="object-cover w-full h-full opacity-30"
            poster="https://images.unsplash.com/photo-1492136344046-866c85e0bf04?auto=format&fit=crop&q=80"
          >
            <source
              src="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
              type="video/mp4"
            />
          </video>
        </div>
        
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
              {profile ? (
                <UserMenu profile={profile} />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-yellow-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </nav>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="perspective-text mb-12">
            <h1 className="text-7xl font-bold mb-6 gradient-text">
              The Future of Lighting Control
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              Revolutionary AI-powered lighting control system with immersive AR/VR integration
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
              onClick={() => setShowVirtualStage(!showVirtualStage)}
              className="absolute -top-12 right-0 text-sm text-gray-400 hover:text-yellow-400 transition-colors flex items-center space-x-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>{showVirtualStage ? 'Hide Virtual Stage' : 'Show Virtual Stage'}</span>
            </button>
            {showVirtualStage ? renderVirtualStage() : null}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg p-6 z-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    if (profile && !isPlaying) {
                      logEffectUsage(effects[currentEffect].name, effects[currentEffect].configuration);
                    }
                  }}
                  className="bg-yellow-400 p-3 rounded-full hover:bg-yellow-300 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black" />}
                </button>
                <div>
                  <div className="font-semibold">Current Effect</div>
                  <div className="text-yellow-400">{effects[currentEffect].name}</div>
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
                      width: `${currentTime}%`,
                      background: effects[currentEffect].color
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setVolume(Math.max(0, volume - 5))}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${volume}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setVolume(Math.min(100, volume + 5))}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
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
      </header>

      <section id="features" className="py-20 px-4 clip-path-slant bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">Revolutionary Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8 text-yellow-400" />,
                title: "AI-Powered Programming",
                description: "Neural network-driven automation and pattern recognition for intelligent show programming"
              },
              {
                icon: <Glasses className="w-8 h-8 text-yellow-400" />,
                title: "AR/VR Integration",
                description: "Immersive programming environment with holographic controls and real-time visualization"
              },
              {
                icon: <Wand2 className="w-8 h-8 text-yellow-400" />,
                title: "Smart Effects Engine",
                description: "Dynamic effects generation with real-time music synchronization and beat detection"
              },
              {
                icon: <Network className="w-8 h-8 text-yellow-400" />,
                title: "Distributed Processing",
                description: "Multi-node computation for complex real-time calculations and rendering"
              },
              {
                icon: <Cpu className="w-8 h-8 text-yellow-400" />,
                title: "GPU Acceleration",
                description: "Hardware-accelerated processing for smooth control of massive fixture arrays"
              },
              {
                icon: <Globe className="w-8 h-8 text-yellow-400" />,
                title: "Cloud Integration",
                description: "Real-time collaboration and show synchronization across multiple venues"
              },
              {
                icon: <Lock className="w-8 h-8 text-yellow-400" />,
                title: "Enterprise Security",
                description: "Military-grade encryption and access control for mission-critical shows"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
                title: "Automated Effects",
                description: "AI-generated lighting sequences based on music analysis and crowd response"
              },
              {
                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                title: "Real-time Processing",
                description: "Ultra-low latency control system with predictive algorithms"
              }
            ].map((feature, index) => (
              <div
                key={index}
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
    </div>
  );
}

export default App;