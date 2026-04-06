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
    title: "Assistance à la programmation",
    description: "Outils d'aide pour accélérer la préparation de shows (règles et automatisations configurables)."
  },
  {
    icon: <Glasses className="w-8 h-8 text-yellow-400" />,
    title: "Prévisualisation immersive (expérimentale)",
    description: "Prévisualisation scène en cours de maturation; support partiel selon l'environnement."
  },
  {
    icon: <Wand2 className="w-8 h-8 text-yellow-400" />,
    title: "Moteur d'effets synchronisés",
    description: 'Effets dynamiques avec synchronisation audio disponible selon la source et la latence.'
  },
  {
    icon: <Network className="w-8 h-8 text-yellow-400" />,
    title: 'Exécution distribuée (beta)',
    description: 'Traitement multi-processus disponible sur certains scénarios runtime.'
  },
  {
    icon: <Cpu className="w-8 h-8 text-yellow-400" />,
    title: 'Accélération matérielle (selon machine)',
    description: 'Utilisation des capacités matérielles locales quand disponibles.'
  },
  {
    icon: <Globe className="w-8 h-8 text-yellow-400" />,
    title: 'Collaboration cloud',
    description: 'Comptes cloud et collaboration disponibles via Supabase, avec limites documentées.'
  },
  {
    icon: <Lock className="w-8 h-8 text-yellow-400" />,
    title: "Sécurité opérationnelle",
    description: "Contrôles d'accès applicatifs, journalisation et bonnes pratiques de durcissement."
  },
  {
    icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
    title: 'Effets assistés',
    description: "Génération semi-automatique d'effets basée sur les paramètres et l'analyse audio."
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    title: 'Traitement temps réel',
    description: 'Pilotage temps réel optimisé; performances dépendantes du matériel et des protocoles.'
  }
];

export function MarketingSections() {
  return (
    <>
      <section id="features" className="py-20 px-4 clip-path-slant bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">Fonctionnalités produit</h2>
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
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">Technologie et état d'avancement</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80"
                alt="AI Technology"
                className="rounded-xl shadow-2xl transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Pipeline de calcul lumière</h3>
                  <p>Le moteur calcule les états lumière en continu selon la configuration active.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Calcul temps réel optimisé</h3>
                <p className="text-gray-400">Algorithmes de calcul orientés stabilité et reproductibilité des scènes.</p>
              </div>
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Traitement distribué (ciblé)</h3>
                <p className="text-gray-400">Traitement multi-nœud prévu pour cas d'usage avancés (non généralisé).</p>
              </div>
              <div className="card-3d border-l-4 border-yellow-400 pl-6 hover:bg-gray-800/50 p-4 rounded-r-xl transition-colors">
                <h3 className="text-2xl font-semibold mb-2">Automatisation pilotée par règles</h3>
                <p className="text-gray-400">Automatisations disponibles sur workflows ciblés; modèles avancés en exploration.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-16 gradient-text">Voir une démo du produit</h2>
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
            <a href="/docs/user/quickstart.md" className="text-gray-400 hover:text-yellow-400 transition-colors">Documentation</a>
            <a href="/docs/legal/cgu.md" className="text-gray-400 hover:text-yellow-400 transition-colors">CGU</a>
            <a href="/docs/legal/privacy.md" className="text-gray-400 hover:text-yellow-400 transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </>
  );
}
