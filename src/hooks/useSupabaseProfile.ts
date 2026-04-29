import { useCallback, useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { observability } from '../lib/observability';

export function useSupabaseProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      observability.error('useSupabaseProfile', 'Failed to fetch Supabase profile', {
        userId,
        error: error.message,
      }, 'sev3', ['auth', 'profile']);
      return;
    }

    setProfile(data);
  }, []);

  useEffect(() => {
    const handleReconnect = () => {
      observability.incident('recovered', 'Client reconnected, refreshing authenticated profile');
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      });
    };

    const handleOffline = () => {
      observability.incident('detected', 'Client went offline; profile and collaboration updates may be stale');
    };

    window.addEventListener('online', handleReconnect);
    window.addEventListener('offline', handleOffline);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleReconnect);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchProfile]);

  return {
    profile,
    isAuthModalOpen,
    openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false)
  };
}
