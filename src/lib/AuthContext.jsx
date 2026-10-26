'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';
import { resolveTenantId, clearActiveTenant } from '@/lib/tenantManager';

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

const getCachedProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const str = sessionStorage.getItem('gp_active_profile') || localStorage.getItem('gp_user_profile');
    if (str) return JSON.parse(str);
  } catch (_) {}
  return null;
};

const buildMergedUser = (sessionUser) => {
  if (!sessionUser) return null;
  const cached = getCachedProfile();
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    full_name: cached?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email,
    phone: cached?.phone || sessionUser.user_metadata?.phone || '',
    avatar_url: cached?.avatar_url || sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
    role: cached?.role || sessionUser.user_metadata?.role || sessionUser.app_metadata?.role || 'owner',
    provider: sessionUser.app_metadata?.provider
  };
};

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
        const sbUser = buildMergedUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gp_dev_auth_user');
        }
        setUser(sbUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        // Force-refresh tenant resolution immediately so all components have the correct tenant ID
        resolveTenantId(true).then((tid) => {
          const cached = getCachedProfile();
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              tenant_id: tid || prev.tenant_id,
              full_name: cached?.full_name || prev.full_name,
              phone: cached?.phone || prev.phone,
              avatar_url: cached?.avatar_url || prev.avatar_url,
              role: cached?.role || prev.role
            };
          });
        }).catch(e => console.warn('[AuthContext] onAuthStateChange resolveTenantId warning:', e));
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

      // 1. Check real Supabase Auth Session FIRST
      console.log('[AuthContext] checkUserAuth calling getSession...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] getSession returned, session exists:', !!session);
      const user = session?.user;
      
      if (user) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gp_dev_auth_user');
        }
        const sbUser = buildMergedUser(user);
        let resolvedTid = null;
        try {
          resolvedTid = await resolveTenantId(true);
        } catch (e) {
          console.warn('[AuthContext] Tenant resolution warning:', e);
        }
        if (resolvedTid) sbUser.tenant_id = resolvedTid;
        const cached = getCachedProfile();
        if (cached) {
          if (cached.full_name) sbUser.full_name = cached.full_name;
          if (cached.phone) sbUser.phone = cached.phone;
          if (cached.avatar_url) sbUser.avatar_url = cached.avatar_url;
          if (cached.role) sbUser.role = cached.role;
        }
        setUser(sbUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      // 2. Check Dev Auth Session in Local Storage ONLY IF no real session AND on local development
      if (typeof window !== 'undefined') {
        const isLocalHost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname.endsWith('.local');

        const devAuthStr = localStorage.getItem('gp_dev_auth_user');
        if (devAuthStr) {
          if (!isLocalHost) {
            // Refuse and scrub dev auth bypass token on production domains
            localStorage.removeItem('gp_dev_auth_user');
          } else {
            try {
              const devUser = JSON.parse(devAuthStr);
              if (devUser && devUser.email) {
                console.log('[AuthContext] Local dev auth user found:', devUser.email);
                setUser(devUser);
                setIsAuthenticated(true);
                setIsLoadingAuth(false);
                setAuthChecked(true);
                return;
              }
            } catch (e) {
              localStorage.removeItem('gp_dev_auth_user');
            }
          }
        }
      }


      // If no valid session exists
      console.log('[AuthContext] No valid session, setting unauthenticated');
      clearActiveTenant();
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

  const loginDevUser = (mockUser = null) => {
    const userToSet = mockUser || {
      id: '57e50365-d351-4acf-a967-c6c0fc62eed9',
      email: 'admin@glopro.salon',
      full_name: 'Quản trị viên (Dev)',
      role: 'owner',
      tenant_id: '57e50365-d351-4acf-a967-c6c0fc62eed9'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('gp_dev_auth_user', JSON.stringify(userToSet));
      localStorage.setItem('gp_active_tenant_id', '57e50365-d351-4acf-a967-c6c0fc62eed9');
      sessionStorage.setItem('gp_active_tenant_id', '57e50365-d351-4acf-a967-c6c0fc62eed9');
      localStorage.setItem('glowpro_branch', '800d714a-245a-4e54-ad95-103ee2e509ca');
    }
    setUser(userToSet);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    clearActiveTenant();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gp_dev_auth_user');
    }
    
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
      loginDevUser,
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
