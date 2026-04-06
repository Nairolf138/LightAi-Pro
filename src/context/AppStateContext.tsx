import { createContext, useContext, type ReactNode } from 'react';
import type { Profile } from '../lib/supabase';

interface PlaybackState {
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

interface VirtualStageState {
  showVirtualStage: boolean;
  toggleVirtualStage: () => void;
  presets: string[];
  activePreset: number;
  nextPreset: () => void;
}

interface AppStateValue {
  profile: Profile | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  showEffectPanel: boolean;
  toggleEffectPanel: () => void;
  playback: PlaybackState;
  virtualStage: VirtualStageState;
}

const AppStateContext = createContext<AppStateValue | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
  value: AppStateValue;
}

export function AppStateProvider({ children, value }: AppStateProviderProps) {
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
