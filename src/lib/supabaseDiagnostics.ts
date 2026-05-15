import { observability } from './observability';
import { SUPABASE_DISABLED_MESSAGE } from './supabaseStatus';

const SUPABASE_DISABLED_LOG_KEY = 'useSupabaseProfile:supabase-disabled';

export function logSupabaseDisabledOnce(data?: Record<string, unknown>) {
  observability.warnOnce(
    SUPABASE_DISABLED_LOG_KEY,
    'useSupabaseProfile',
    SUPABASE_DISABLED_MESSAGE,
    data,
    ['auth', 'configuration'],
  );
}
