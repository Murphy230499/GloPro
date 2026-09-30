import { supabase } from './supabaseClient';

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
 * Synchronously retrieves cached tenant ID from memory or browser storage.
 */
export function getSyncTenantId() {
  if (inMemoryTenantId) return inMemoryTenantId;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('gp_active_tenant_id') || localStorage.getItem('gp_active_tenant_id');
    
    // Check logged in user email in Supabase auth local storage to immediately link known tenant
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('auth-token')) {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            const email = parsed?.user?.email?.toLowerCase();
            const uid = parsed?.user?.id;
            if (email && KNOWN_TENANT_MAP[email]) {
              const tid = KNOWN_TENANT_MAP[email];
              inMemoryTenantId = tid;
              sessionStorage.setItem('gp_active_tenant_id', tid);
              localStorage.setItem('gp_active_tenant_id', tid);
              return tid;
            } else if (uid && KNOWN_TENANT_MAP[uid]) {
              const tid = KNOWN_TENANT_MAP[uid];
              inMemoryTenantId = tid;
              sessionStorage.setItem('gp_active_tenant_id', tid);
              localStorage.setItem('gp_active_tenant_id', tid);
              return tid;
            }
          }
        }
      }
    } catch (e) {}

    // If the stored tenant id is the known dummy ID from previous bug, self-heal immediately to the real salon
    if (stored === 'db1d2d2d-4b05-450d-88b9-54e7715b436b' || stored === '3466655b-41ab-4a4e-bf4a-c9deac3ee55e') {
      const restored = '6cb88c32-06c6-4b95-b286-99bc8c141c79';
      sessionStorage.setItem('gp_active_tenant_id', restored);
      localStorage.setItem('gp_active_tenant_id', restored);
      inMemoryTenantId = restored;
      return restored;
    }
    if (stored) {
      inMemoryTenantId = stored;
      return stored;
    }
  }
  return null;
}

const KNOWN_TENANT_MAP = {
  'infinitystudio9969@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'ducledinhqt@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'minhphantester2021@gmail.com': '0a5e5b54-00b5-4fdc-80b4-aba8bbe48f7c',
  'db1d2d2d-4b05-450d-88b9-54e7715b436b': '6cb88c32-06c6-4b95-b286-99bc8c141c79'
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
      const user = sessionRes.data?.session?.user;
      if (!user) return null;

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
            body: JSON.stringify({ email: user.email.toLowerCase(), userId: user.id })
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
        const { data: profiles, error } = await supabase
          .from('user_profile')
          .select('id, email, role, tenant_id')
          .or(`id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
          .limit(1);

        profile = profiles?.[0];
        tid = profile?.tenant_id;
      }

      if (!tid) {
        if (!profile) {
          // Auto create profile for brand new salon owner registering
          tid = user.id;
          try {
            await supabase.from('user_profile').insert([{
              email: user.email.toLowerCase(),
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
              role: 'owner',
              status: 'active',
              type: 'Employee',
              tenant_id: tid
            }]);
          } catch (e) {
            console.warn('[TenantManager] Failed to auto-create user_profile on signup:', e);
          }
        } else if (profile.role === 'owner' || !profile.role) {
          tid = user.id;
          try {
            await supabase.from('user_profile').update({ tenant_id: tid }).eq('id', profile.id);
          } catch (e) {
            console.warn('[TenantManager] Failed to update owner tenant_id:', e);
          }
        } else {
          tid = user.id;
        }
      }

      if (tid) {
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
