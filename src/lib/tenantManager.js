import { supabase } from './supabaseClient.js';

/**
 * All business tables in the system that are strictly isolated by Salon (Tenant).
 */
export const TENANT_SCOPED_TABLES = new Set([
  'appointment',
  'bookingsetting',
  'branch',
  'cashvoucher',
  'cashvouchertype',
  'customer',
  'customer_gifts',
  'customer_package',
  'customer_segments_auto',
  'customer_treatment',
  'customergroup',
  'customersegment',
  'customertier',
  'customertierhistory',
  'deposit',
  'deposit_policy',
  'deposit_transaction',
  'facility',
  'inventory_receipt_items',
  'inventory_receipts',
  'inventory_suppliers',
  'inventory_transfer_items',
  'inventory_transfers',
  'invoice',
  'loyaltyrule',
  'membership',
  'package_usage_history',
  'prepaidcard',
  'product',
  'productcombo',
  'promo_usages',
  'promotions',
  'revenuebonusrule',
  'role_permissions',
  'roles',
  'room',
  'service',
  'servicecombo',
  'servicegroup',
  'servicepackage',
  'shift',
  'shifttemplate',
  'staff',
  'staff_leaves',
  'staffattendance',
  'staffcommissionconfig',
  'staffcommissionrule',
  'staffgroup',
  'staffschedule',
  'treatment',
  'user',
  'user_profile',
  'vouchers'
]);

let inMemoryTenantId = null;
let tenantPromise = null;

/**
 * Sets tenant ID in memory for synchronous access (e.g. server-side API request lifecycle).
 */
export function setSyncTenantId(tid) {
  if (tid) {
    inMemoryTenantId = tid;
  }
}

/**
 * Synchronously retrieves cached tenant ID from memory or browser storage.
 */
export function getSyncTenantId() {
  if (inMemoryTenantId) return inMemoryTenantId;
  if (typeof window !== 'undefined') {
    // Check if real Supabase Auth session token is in localStorage
    let authEmail = null;
    let authUid = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('auth-token')) {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed?.user) {
              authEmail = parsed.user.email?.toLowerCase();
              authUid = parsed.user.id;
              break;
            }
          }
        }
      }
    } catch (e) {}

    // If real Supabase user is logged in
    if (authUid || authEmail) {
      // Clean up dev mock user if it was left over
      localStorage.removeItem('gp_dev_auth_user');

      // Check if known demo salon owner
      if (authEmail && KNOWN_TENANT_MAP[authEmail]) {
        const tid = KNOWN_TENANT_MAP[authEmail];
        inMemoryTenantId = tid;
        sessionStorage.setItem('gp_active_tenant_id', tid);
        localStorage.setItem('gp_active_tenant_id', tid);
        return tid;
      }
      if (authUid && KNOWN_TENANT_MAP[authUid]) {
        const tid = KNOWN_TENANT_MAP[authUid];
        inMemoryTenantId = tid;
        sessionStorage.setItem('gp_active_tenant_id', tid);
        localStorage.setItem('gp_active_tenant_id', tid);
        return tid;
      }

      // For standard logged-in users, check stored tenant ID
      const stored = sessionStorage.getItem('gp_active_tenant_id') || localStorage.getItem('gp_active_tenant_id');
      if (stored && stored !== 'db1d2d2d-4b05-450d-88b9-54e7715b436b') {
        inMemoryTenantId = stored;
        return stored;
      }

      // Default isolated tenant ID for a new user is their own authUid
      if (authUid) {
        inMemoryTenantId = authUid;
        sessionStorage.setItem('gp_active_tenant_id', authUid);
        localStorage.setItem('gp_active_tenant_id', authUid);
        return authUid;
      }
    }

    // Only if NO real user is logged in, check dev mock user (local developer mode)
    try {
      const devUser = localStorage.getItem('gp_dev_auth_user');
      if (devUser) {
        const parsed = JSON.parse(devUser);
        const email = parsed?.email?.toLowerCase();
        const tid = (email && KNOWN_TENANT_MAP[email]) || '57e50365-d351-4acf-a967-c6c0fc62eed9';
        inMemoryTenantId = tid;
        return tid;
      }
    } catch (e) {}

    const stored = sessionStorage.getItem('gp_active_tenant_id') || localStorage.getItem('gp_active_tenant_id');
    if (stored && stored !== 'db1d2d2d-4b05-450d-88b9-54e7715b436b' && stored !== '3466655b-41ab-4a4e-bf4a-c9deac3ee55e') {
      inMemoryTenantId = stored;
      return stored;
    }

    return '57e50365-d351-4acf-a967-c6c0fc62eed9';
  }
  return null;
}

const KNOWN_TENANT_MAP = {
  'dev_user_admin': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'admin@glopro.salon': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'infinitystudio9969@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'ducledinhqt@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'minhphantester2021@gmail.com': '0a5e5b54-00b5-4fdc-80b4-aba8bbe48f7c',
};

/**
 * Asynchronously and reliably resolves the current salon Tenant ID.
 * Follows hierarchy:
 * 1. user_profile.tenant_id (if assigned)
 * 2. If user is owner or new user without tenant_id -> user.id
 * 3. Auto-persists to user_profile and cache
 */
export async function resolveTenantId(forceRefresh = false) {
  if (!forceRefresh) {
    const sync = getSyncTenantId();
    if (sync) return sync;
  }

  if (tenantPromise && !forceRefresh) return tenantPromise;

  tenantPromise = (async () => {
    try {
      const sessionRes = await supabase.auth.getSession();
      let user = sessionRes.data?.session?.user;
      if (!user && typeof window !== 'undefined') {
        const devUser = localStorage.getItem('gp_dev_auth_user');
        if (devUser) {
          try { user = JSON.parse(devUser); } catch (e) {}
        }
      }
      if (!user) {
        if (typeof window !== 'undefined') {
          return '57e50365-d351-4acf-a967-c6c0fc62eed9';
        }
        return null;
      }

      let tid = null;
      let profile = null;

      // 0. Immediate check for known salon owners
      if (user.email && KNOWN_TENANT_MAP[user.email.toLowerCase()]) {
        tid = KNOWN_TENANT_MAP[user.email.toLowerCase()];
      } else if (KNOWN_TENANT_MAP[user.id]) {
        tid = KNOWN_TENANT_MAP[user.id];
      }

      // 1. Try server API /api/tenant/resolve first (has admin privileges to bypass client RLS)
      if (typeof window !== 'undefined' && user.email) {
        try {
          const apiRes = await fetch('/api/tenant/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email.toLowerCase(),
              userId: user.id,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email
            })
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.tenantId) {
              tid = apiData.tenantId;
              if (apiData.profile) {
                profile = apiData.profile;
                sessionStorage.setItem('gp_active_profile', JSON.stringify(apiData.profile));
              }
            }
          }
        } catch (apiErr) {
          console.warn('[TenantManager] Server tenant resolve failed, falling back to direct query:', apiErr);
        }
      }

      // 2. Fallback to client-side user_profile query if API was unavailable
      if (!tid) {
        const { data: profiles } = await supabase
          .from('user_profile')
          .select('id, email, role, tenant_id')
          .or(`id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
          .limit(1);

        profile = profiles?.[0];
        tid = profile?.tenant_id;
      }

      if (!tid) {
        tid = user.id;
      }

      if (tid) {
        const prevTid = localStorage.getItem('gp_active_tenant_id');
        if (prevTid && prevTid !== tid) {
          // If switching to a different tenant, clear previous branch selection
          localStorage.removeItem('glowpro_branch');
        }
        inMemoryTenantId = tid;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gp_active_tenant_id', tid);
          localStorage.setItem('gp_active_tenant_id', tid);
        }
      }
      return tid;
    } catch (e) {
      console.error('[TenantManager] Error resolving tenant ID:', e);
      return null;
    } finally {
      tenantPromise = null;
    }
  })();

  return tenantPromise;
}

/**
 * Checks whether the salon (tenant) already has any existing business data.
 * Checks core entities: customer, service, appointment, staff, product, invoice, facility, treatment, and non-demo branch.
 */
export async function hasExistingTenantData(tenantId) {
  if (!tenantId) return false;
  try {
    const checks = await Promise.allSettled([
      supabase.from('customer').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('service').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('appointment').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('staff').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('product').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('invoice').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('treatment').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('facility').select('id').eq('tenant_id', tenantId).limit(1),
      supabase.from('branch').select('id, name').eq('tenant_id', tenantId).neq('name', 'GloPro Demo').limit(1)
    ]);

    for (const res of checks) {
      if (res.status === 'fulfilled' && res.value?.data && res.value.data.length > 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('[TenantManager] Error checking existing tenant data:', err);
    return true; // Safe default
  }
}

/**
 * Returns a tenant-isolated storage key.
 * e.g. getTenantStorageKey('gp_rooms', branchId) -> 'gp_rooms_TENANT_ID_BRANCH_ID'
 */
export function getTenantStorageKey(prefix, suffix = '') {
  const tid = getSyncTenantId() || 'default';
  return `${prefix}_${tid}_${suffix}`;
}

/**
 * Clears active tenant cache and purges all tenant-specific data from localStorage upon user logout.
 */
export function clearActiveTenant() {
  inMemoryTenantId = null;
  if (typeof window !== 'undefined') {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('gp_') || k.startsWith('glowpro_') || k.startsWith('glopro_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const sKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('gp_') || k.startsWith('glowpro_') || k.startsWith('glopro_'))) {
        sKeys.push(k);
      }
    }
    sKeys.forEach(k => sessionStorage.removeItem(k));
  }
}

// Automatically subscribe to auth state changes to keep tenant in sync
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      clearActiveTenant();
    } else if (session?.user) {
      resolveTenantId().catch(() => {});
    }
  });
}
