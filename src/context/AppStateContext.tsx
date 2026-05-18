import { createContext, useContext, type ReactNode } from 'react';
import type { AppStateValue } from './AppStateTypes';

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
