import { supabase, supabaseClient } from './supabaseClient';

export const base44 = supabaseClient;

let inMemoryCache = null;

export async function getCachedPermissions() {
  if (inMemoryCache) {
    return inMemoryCache;
  }
  
  if (typeof window === 'undefined') {
    return 'all';
  }
  
  const cached = sessionStorage.getItem('gp_cached_perms');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      inMemoryCache = parsed;
      return parsed;
    } catch (e) {
      // ignore
    }
  }

  try {
    const sessionRes = await supabase.auth.getSession();
    const session = sessionRes.data?.session;
    if (!session?.user) {
      return 'all';
    }
    const email = session.user.email;
    const userProfiles = await supabaseClient.entities.UserProfile.list();
    const found = userProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return 'all';
    }

    if (found.role === 'owner') {
      const res = 'all';
      sessionStorage.setItem('gp_cached_perms', JSON.stringify(res));
      inMemoryCache = res;
      return res;
    }

    const perms = await supabaseClient.entities.RolePermission.list();
    const blocked = perms.filter(p => p.role === found.role && p.can_view === false).map(p => p.module);
    const res = { type: 'blacklist', blocked, role: found.role };
    sessionStorage.setItem('gp_cached_perms', JSON.stringify(res));
    inMemoryCache = res;
    return res;
  } catch (err) {
    console.error('Failed to get cached permissions:', err);
    return 'all';
  }
}

export function clearCachedPermissions() {
  inMemoryCache = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('gp_cached_perms');
  }
}

