import { createContext, useContext } from 'react';
import type { AppStateValue } from './AppStateTypes';

export const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
