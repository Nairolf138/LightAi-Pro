import type { ReactNode } from 'react';
import { AppStateContext } from './appState';
import type { AppStateValue } from './AppStateTypes';

interface AppStateProviderProps {
  children: ReactNode;
  value: AppStateValue;
}

export function AppStateProvider({ children, value }: AppStateProviderProps) {
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
