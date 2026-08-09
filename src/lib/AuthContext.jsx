'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: true,
  authError: null,
  appPublicSettings: null,
  login: () => {},
  logout: () => {},
  navigateToLogin: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();

    // Listen to Supabase OAuth events (Google / Facebook)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'session exists:', !!session);
      if (session?.user) {
        console.log('[AuthContext] Setting user from onAuthStateChange');
        const sbUser = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          provider: session.user.app_metadata?.provider
        };
        setUser(sbUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] SIGNED_OUT event received, clearing session');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Mock public settings since we migrated away from Base44
      setAppPublicSettings({ id: appParams.appId, public_settings: { requireAuth: false } });
      
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      // Prevent race condition during OAuth redirect
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const search = window.location.search;
        
        // Handle OAuth error in URL to prevent getSession from hanging
        if (search.includes('error=') || hash.includes('error=')) {
          console.error('OAuth error detected in URL');
          // Clear the error from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('error');
          url.searchParams.delete('error_code');
          url.searchParams.delete('error_description');
          window.history.replaceState({}, '', url.toString());
          
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
          return;
        }

        // Wait for onAuthStateChange to parse the URL hash for OAuth
        if (search.includes('code=') || hash.includes('access_token=')) {
          console.log('[AuthContext] OAuth tokens detected in URL. Waiting for onAuthStateChange...');
          // Fallback timeout just in case onAuthStateChange fails or hangs
          setTimeout(() => {
            console.log('[AuthContext] Timeout waiting for onAuthStateChange. Proceeding with unauthenticated state...');
            // Clean up the URL to prevent permanent hanging on refresh
            if (window.location.hash || window.location.search) {
              const url = new URL(window.location.href);
              url.hash = '';
              url.searchParams.delete('code');
              window.history.replaceState({}, '', url.toString());
            }
            setIsLoadingAuth(false);
            setAuthChecked(true);
          }, 3000);
          return;
        }
      }

      // 1. Check Supabase OAuth Session
      console.log('[AuthContext] checkUserAuth calling getSession...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] getSession returned, session exists:', !!session);
      const user = session?.user;
      
      if (user) {
        console.log('[AuthContext] Valid user found in getSession, setting authenticated');
        const sbUser = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          provider: user.app_metadata?.provider
        };
        setUser(sbUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }


      // If no valid session exists
      console.log('[AuthContext] No valid session, setting unauthenticated');
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    await supabase.auth.signOut().catch(() => {});
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
