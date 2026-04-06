import { useCallback, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AuthModal } from './components/AuthModal';
import { EffectSidePanel } from './components/layout/EffectSidePanel';
import { HeroSection } from './components/layout/HeroSection';
import { MarketingSections } from './components/layout/MarketingSections';
import { Navbar } from './components/layout/Navbar';
import { PlayerBar } from './components/layout/PlayerBar';
import { AppStateProvider } from './context/AppStateContext';
import { usePlaybackState } from './hooks/usePlaybackState';
import { useSupabaseProfile } from './hooks/useSupabaseProfile';
import {
  applyConfigurationToEngine,
  migrateAndValidateConfiguration,
  prepareConfigurationForStorage,
  rollbackConfiguration
} from './lib/effectConfiguration';
import { effects } from './lib/effects';
import { supabase } from './lib/supabase';

function App() {
  const [showVirtualStage, setShowVirtualStage] = useState(false);
  const [showEffectPanel, setShowEffectPanel] = useState(false);
  const profileState = useSupabaseProfile();

  const traceAuditEvent = useCallback(
    async (
      action: string,
      payload: {
        effectName: string;
        source: string;
        detail: Record<string, unknown>;
      }
    ) => {
      const technicalAudit = {
        who: profileState.profile?.id ?? 'anonymous',
        what: action,
        when: new Date().toISOString(),
        ...payload
      };

      console.info('[PresetAudit]', technicalAudit);

      if (!profileState.profile) {
        return;
      }

      const { error } = await supabase.from('effect_history').insert([
        {
          user_id: profileState.profile.id,
          effect_name: `${action}:${payload.effectName}`,
          configuration: technicalAudit
        }
      ]);

      if (error) {
        console.error('Error tracing audit event:', error);
      }
    },
    [profileState.profile]
  );

  const logEffectUsage = useCallback(
    async (effectName: string, configuration: Record<string, unknown>) => {
      if (!profileState.profile) return;

      const { error } = await supabase.from('effect_history').insert([
        {
          user_id: profileState.profile.id,
          effect_name: effectName,
          configuration: prepareConfigurationForStorage(effectName, configuration, 'history')
        }
      ]);

      if (error) {
        console.error('Error logging effect usage:', error);
      }
    },
    [profileState.profile]
  );

  const applyPersistedConfiguration = useCallback(
    async (payload: Record<string, unknown>, source: 'preset' | 'history') => {
      const fallbackEffect = effects[0]?.name ?? 'Color Chase';

      try {
        const normalized = migrateAndValidateConfiguration(payload, fallbackEffect);

        let appliedEffectIndex = -1;
        let previousConfiguration: Record<string, unknown> | null = null;

        try {
          const applied = applyConfigurationToEngine(normalized.effectName, normalized.configuration);
          appliedEffectIndex = applied.effectIndex;
          previousConfiguration = applied.previousConfiguration;
        } catch (applyError) {
          if (appliedEffectIndex >= 0 && previousConfiguration) {
            rollbackConfiguration(appliedEffectIndex, previousConfiguration);
          }
          throw applyError;
        }

        await traceAuditEvent('APPLY_SUCCESS', {
          effectName: normalized.effectName,
          source,
          detail: {
            schemaVersion: normalized.version
          }
        });

        toast.success(`${source === 'preset' ? 'Preset' : 'Configuration'} loaded on engine`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown configuration error';

        await traceAuditEvent('APPLY_FAILED', {
          effectName: fallbackEffect,
          source,
          detail: {
            reason: message
          }
        });

        toast.error(`Load failed: ${message}`);
      }
    },
    [traceAuditEvent]
  );

  const playbackState = usePlaybackState({
    effectsCount: effects.length,
    onPlayStart: (currentEffect) => {
      void logEffectUsage(effects[currentEffect].name, effects[currentEffect].configuration);
    },
    onEffectAdvanced: (nextEffect) => {
      void logEffectUsage(effects[nextEffect].name, effects[nextEffect].configuration);
    }
  });

  const handleLoadPreset = useCallback((configuration: Record<string, unknown>) => {
    void applyPersistedConfiguration(configuration, 'preset');
  }, [applyPersistedConfiguration]);

  const handleLoadConfiguration = useCallback((configuration: Record<string, unknown>) => {
    void applyPersistedConfiguration(configuration, 'history');
  }, [applyPersistedConfiguration]);

  const appState = useMemo(
    () => ({
      profile: profileState.profile,
      isAuthModalOpen: profileState.isAuthModalOpen,
      openAuthModal: profileState.openAuthModal,
      closeAuthModal: profileState.closeAuthModal,
      showEffectPanel,
      toggleEffectPanel: () => setShowEffectPanel((prev) => !prev),
      playback: playbackState,
      virtualStage: {
        showVirtualStage,
        toggleVirtualStage: () => setShowVirtualStage((prev) => !prev),
        presets: [],
        activePreset: 0,
        nextPreset: () => {
          // managed in dedicated virtual-stage hook
        }
      }
    }),
    [playbackState, profileState, showEffectPanel, showVirtualStage]
  );

  return (
    <AppStateProvider value={appState}>
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <Toaster position="top-right" />
        <AuthModal isOpen={profileState.isAuthModalOpen} onClose={profileState.closeAuthModal} />

        <EffectSidePanel onLoadPreset={handleLoadPreset} onLoadConfiguration={handleLoadConfiguration} />

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

          <Navbar />
          <HeroSection />
          <PlayerBar />
        </header>

        <MarketingSections />
      </div>
    </AppStateProvider>
  );
}

export default App;
