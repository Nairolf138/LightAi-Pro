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
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EffectHistory = {
  id: string;
  user_id: string;
  effect_name: string;
  configuration: Record<string, unknown>;
  used_at: string;
};


export type Role = {
  id: number;
  slug: 'owner' | 'operator' | 'viewer';
  description: string;
  permissions: Record<string, unknown>;
  created_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  live_state: Record<string, unknown>;
  state_version: number;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  project_id: string;
  user_id: string;
  role_id: number;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SharedShow = {
  id: string;
  project_id: string;
  title: string;
  show_payload: Record<string, unknown>;
  state_version: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionJournal = {
  id: number;
  project_id: string;
  shared_show_id: string | null;
  actor_id: string;
  action_type: string;
  cue_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};
