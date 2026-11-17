import { createClient } from '@supabase/supabase-js';

// Production Cloud Supabase configuration for multi-device sync
const PRODUCTION_SUPABASE_URL = 'https://vhwurjcyjbcqyfmnwdaq.supabase.co';
const PRODUCTION_SUPABASE_KEY = 'sb_publishable_Tk30HnWLAgPUyPt20Mh2xg_HUS13KM7';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = (envUrl && !envUrl.includes('placeholder-project')) 
  ? envUrl 
  : PRODUCTION_SUPABASE_URL;

export const supabaseAnonKey = (envKey && !envKey.includes('placeholder-anon-key')) 
  ? envKey 
  : PRODUCTION_SUPABASE_KEY;

export const isLiveSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder-project') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_SETUP_SECRET = import.meta.env.VITE_ADMIN_SETUP_SECRET || 'MEDISTOCK_SECRET_2026';
