import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder-project') &&
    supabaseUrl.startsWith('https://')
  );
};

// Create real client if configured, otherwise create dummy client that can be handled gracefully
export const supabase = createClient(
  isLiveSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isLiveSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key'
);

export const ADMIN_SETUP_SECRET = import.meta.env.VITE_ADMIN_SETUP_SECRET || 'MEDISTOCK_SECRET_2026';
