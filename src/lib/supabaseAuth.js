import { supabase } from '@/lib/supabaseClient';

/**
 * Initiates Google OAuth login via Supabase
 */
export async function loginWithGoogleSupabase() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Initiates Facebook OAuth login via Supabase
 */
export async function loginWithFacebookSupabase() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${origin}/`,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Signs out current Supabase session
 */
export async function logoutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Supabase logout error:', error);
}
