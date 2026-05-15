import { useCallback, useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AuthModal } from './components/AuthModal';
import { EffectSidePanel } from './components/layout/EffectSidePanel';
import { DiagnosticsPanel } from './components/layout/DiagnosticsPanel';
import { HeroSection } from './components/layout/HeroSection';
import { MarketingSections } from './components/layout/MarketingSections';
import { Navbar } from './components/layout/Navbar';
import { PlayerBar } from './components/layout/PlayerBar';
import { ConflictResolutionPanel } from './components/ConflictResolutionPanel';
import { CopilotWorkspace } from './features/copilot/CopilotWorkspace';
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
import { buildIncidentReport, downloadIncidentReport, observability } from './lib/observability';
import { runtimeClient, runtimeFallbackStatus } from './lib/runtimeClient';
import { isWebRuntime } from './lib/runtimeEnvironment';
import { SUPABASE_DISABLED_MESSAGE, supabase } from './lib/supabase';
import { emitAiSuggestionEvent } from './lib/aiSuggestionTelemetry';
import type { CollaborationConflict, GuidedMergeResolution } from './lib/collaborationStrategy';

function App() {
  const [activeConflict, setActiveConflict] = useState<CollaborationConflict<Record<string, unknown>> | null>(null);
  const [showVirtualStage, setShowVirtualStage] = useState(false);
  const [showEffectPanel, setShowEffectPanel] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState(() => ({
    ready: false,
    connectedDeviceId: null,
    protocol: null,
    metrics: {
      protocolQueueDepth: 0,
      protocolQueueHighWatermark: 0,
      protocolDroppedFrames: 0
    }
  }));
  const profileState = useSupabaseProfile();

  const telemetryContext = useMemo(() => ({
    eventVersion: '1.0',
    model: import.meta.env.VITE_MODEL_VERSION ?? 'unknown',
    variant: import.meta.env.VITE_RULESET_VERSION ?? 'default',
    featureFlags: {
      namingAssistant: true,
      diagnosticsPanel: true,
    },
  }), []);


  useEffect(() => {
    observability.setShowId('main-show');
    observability.info('app', 'Application booted');
  }, []);

  useEffect(() => {
    const pollStatus = () => {
      runtimeClient
        .getRuntimeStatus()
        .then((status) => {
          setRuntimeStatus(status);
          observability.setProtocolMetrics({
            queueDepth: status.metrics.protocolQueueDepth,
            queueHighWatermark: status.metrics.protocolQueueHighWatermark,
            droppedFrames: status.metrics.protocolDroppedFrames
          });
        })
        .catch((error) => {
          observability.warn('runtime', 'Runtime status polling failed', {
            reason: error instanceof Error ? error.message : String(error)
          }, ['runtime', 'ipc']);
        });
    };

    if (isWebRuntime) {
      setRuntimeStatus(runtimeFallbackStatus);
      observability.debug('runtime', 'Browser/dev runtime fallback active', undefined, ['runtime', 'web']);
      return undefined;
    }

    pollStatus();

    const id = window.setInterval(pollStatus, 1000);
    return () => clearInterval(id);
  }, []);

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

      observability.info('preset-audit', action, technicalAudit);

      if (!profileState.profile || !supabase) {
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
        observability.error('preset-audit', 'Error tracing audit event', {
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    },
    [profileState.profile]
  );

  const logEffectUsage = useCallback(
    async (effectName: string, configuration: Record<string, unknown>) => {
      if (!profileState.profile || !supabase) return;

      const { error } = await supabase.from('effect_history').insert([
        {
          user_id: profileState.profile.id,
          effect_name: effectName,
          configuration: prepareConfigurationForStorage(effectName, configuration, 'history')
        }
      ]);

      if (error) {
        observability.error('preset-audit', 'Error logging effect usage', {
          reason: error instanceof Error ? error.message : String(error)
        });
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

        if (profileState.profile) {
          await emitAiSuggestionEvent({
            eventType: 'ai_suggestion_applied',
            operatorId: profileState.profile.id,
            sessionId: observability.snapshot().sessionId,
            suggestionId: `preset-${source}-${normalized.effectName}`,
            showId: observability.snapshot().showId,
            model: telemetryContext.model,
            variant: telemetryContext.variant,
            outcome: 'accepted',
            context: { source },
            ...telemetryContext,
            patchErrorCountBefore: 1,
            patchErrorCountAfter: 0,
          });
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

        if (profileState.profile) {
          await emitAiSuggestionEvent({
            eventType: 'ai_suggestion_rejected',
            operatorId: profileState.profile.id,
            sessionId: observability.snapshot().sessionId,
            suggestionId: `preset-${source}-${fallbackEffect}`,
            showId: observability.snapshot().showId,
            model: telemetryContext.model,
            variant: telemetryContext.variant,
            outcome: message.toLowerCase().includes('fallback') ? 'fallback_provider' : 'rejected',
            context: { source, reason: message },
            ...telemetryContext,
            patchErrorCountBefore: 1,
            patchErrorCountAfter: 1,
          });
        }

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
    [profileState.profile, telemetryContext, traceAuditEvent]
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

  const handleConflictResolution = useCallback((resolution: GuidedMergeResolution<Record<string, unknown>>) => {
    observability.info('collaboration', 'Operator resolved conflict from UI', {
      fallbackToManual: resolution.fallbackToManual ?? false,
      fields: Object.keys(resolution.fieldChoices),
    });
    if (profileState.profile) {
      void emitAiSuggestionEvent({
        eventType: 'ai_suggestion_edited',
        eventVersion: telemetryContext.eventVersion,
        operatorId: profileState.profile.id,
        sessionId: observability.snapshot().sessionId,
        showId: observability.snapshot().showId,
        suggestionId: 'conflict-resolution',
        model: telemetryContext.model,
        variant: telemetryContext.variant,
        outcome: resolution.fallbackToManual ? 'manual_override' : 'accepted_partial',
        context: { fields: Object.keys(resolution.fieldChoices) },
        featureFlags: telemetryContext.featureFlags,
      });
    }
    setActiveConflict(null);
    toast.success('Résolution de conflit enregistrée');
  }, [profileState.profile, telemetryContext]);



  useEffect(() => {
    return () => {
      if (!profileState.profile) {
        return;
      }
      void emitAiSuggestionEvent({
        eventType: 'ai_suggestion_edited',
        operatorId: profileState.profile.id,
        sessionId: observability.snapshot().sessionId,
        showId: observability.snapshot().showId,
        model: telemetryContext.model,
        variant: telemetryContext.variant,
        outcome: 'manual_override',
        suggestionId: 'session-summary',
        context: {
          logs: observability.snapshot().logs.length,
          droppedFrames: observability.snapshot().metrics.droppedFrames,
        },
        ...telemetryContext,
      });
    };
  }, [profileState.profile, telemetryContext]);

  const exportIncidentReport = useCallback(
    (scope: 'private' | 'public') => {
      const report = buildIncidentReport({
        exportScope: scope,
        runtimeStatus,
        appConfig: {
          virtualStageEnabled: showVirtualStage,
          effectPanelOpen: showEffectPanel,
          activeEffectIndex: playbackState.currentEffect,
          volume: playbackState.volume,
          muted: playbackState.isMuted,
          profile: profileState.profile
            ? {
                user_id: profileState.profile.id,
                email: profileState.profile.email,
                role: profileState.profile.role
              }
            : null
        }
      });

      const suffix = scope === 'public' ? 'public' : 'private';
      downloadIncidentReport(`lightai-incident-${suffix}-${new Date().toISOString()}.json`, report);
      observability.info('diagnostics', 'Incident report exported', { scope });
    },
    [playbackState.currentEffect, playbackState.isMuted, playbackState.volume, profileState.profile, runtimeStatus, showEffectPanel, showVirtualStage]
  );

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
      },
      diagnostics: {
        isOpen: showDiagnostics,
        toggle: () => setShowDiagnostics((prev) => !prev),
        snapshot: observability.snapshot(),
        runtimeStatus,
        exportIncidentReport
      }
    }),
    [exportIncidentReport, playbackState, profileState, runtimeStatus, showDiagnostics, showEffectPanel, showVirtualStage]
  );

  return (
    <AppStateProvider value={appState}>
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <Toaster position="top-right" />
        {!supabase && (
          <div className="fixed left-1/2 top-24 z-50 w-[min(90vw,42rem)] -translate-x-1/2 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-center text-sm text-yellow-100 shadow-xl backdrop-blur">
            {SUPABASE_DISABLED_MESSAGE}
          </div>
        )}
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
          <DiagnosticsPanel />
          <HeroSection />
          <PlayerBar />
        </header>

        <MarketingSections />
        <main className="mx-auto w-full max-w-6xl px-6 pb-16">
          <CopilotWorkspace />
        </main>
        <ConflictResolutionPanel conflict={activeConflict} onResolve={handleConflictResolution} />
      </div>
    </AppStateProvider>
  );
}

export default App;
