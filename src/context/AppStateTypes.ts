import type { RuntimeStatus } from '../../desktop/ipc/contracts';
import type { ObservabilitySnapshot } from '../lib/observability';
import type { Profile } from '../lib/supabase';

export interface PlaybackState {
  isPlaying: boolean;
  currentEffect: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  togglePlay: () => void;
  increaseVolume: () => void;
  decreaseVolume: () => void;
  toggleMute: () => void;
}

export interface VirtualStageState {
  showVirtualStage: boolean;
  toggleVirtualStage: () => void;
  presets: string[];
  activePreset: number;
  nextPreset: () => void;
}

export interface DiagnosticsState {
  isOpen: boolean;
  toggle: () => void;
  snapshot: ObservabilitySnapshot;
  runtimeStatus: RuntimeStatus;
  exportIncidentReport: (scope: 'private' | 'public') => void;
}

export interface AppStateValue {
  profile: Profile | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  showEffectPanel: boolean;
  toggleEffectPanel: () => void;
  playback: PlaybackState;
  virtualStage: VirtualStageState;
  diagnostics: DiagnosticsState;
}
