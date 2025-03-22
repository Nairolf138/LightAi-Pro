import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type Preset = {
  id: string;
  user_id: string;
  name: string;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type EffectHistory = {
  id: string;
  user_id: string;
  effect_name: string;
  configuration: Record<string, any>;
  used_at: string;
};