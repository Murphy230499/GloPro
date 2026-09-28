import { supabase } from './supabaseClient';

/**
 * All business tables in the system that are strictly isolated by Salon (Tenant).
 */
export const TENANT_SCOPED_TABLES = new Set([
  'appointment',
  'branch',
  'customer',
  'customergroup',
  'customersegment',
  'customertier',
  'customertierhistory',
  'deposit',
  'deposit_policy',
  'deposit_transaction',
  'facility',
  'room',
  'invoice',
  'loyaltyrule',
  'membership',
  'prepaidcard',
  'product',
  'productcombo',
  'service',
  'servicecombo',
  'servicegroup',
  'servicepackage',
  'treatment',
  'shift',
  'shifttemplate',
  'staff',
  'staffattendance',
  'staffcommissionrule',
  'staffgroup',
  'staffschedule',
  'cashvoucher',
  'cashvouchertype',
  'bookingsetting',
  'customer_package',
  'customer_treatment',
  'user_profile',
  'role_permissions',
  'roles'
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
    if (stored) {
      inMemoryTenantId = stored;
      return stored;
    }
  }
  return null;
}

/**
 * Asynchronously and reliably resolves the current salon Tenant ID.
 * Follows hierarchy:
 * 1. user_profile.tenant_id (if assigned)
 * 2. If user is owner or new user without tenant_id -> user.id
 * 3. Auto-persists to user_profile and cache
 */
export async function resolveTenantId() {
  const sync = getSyncTenantId();
  if (sync) return sync;

  if (tenantPromise) return tenantPromise;

  tenantPromise = (async () => {
    try {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes.data?.session?.user;
      if (!user) return null;

      // 1. Query user_profile
      const { data: profiles, error } = await supabase
        .from('user_profile')
        .select('id, email, role, tenant_id')
        .eq('email', user.email.toLowerCase())
        .limit(1);

      let profile = profiles?.[0];
      let tid = profile?.tenant_id;

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
      if (k && (k.startsWith('gp_') || k.startsWith('glowpro_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const sKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('gp_') || k.startsWith('glowpro_'))) {
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
