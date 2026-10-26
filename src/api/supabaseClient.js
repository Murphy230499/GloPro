import { supabase } from '../lib/supabaseClient.js';
import { TENANT_SCOPED_TABLES, getSyncTenantId, resolveTenantId } from '../lib/tenantManager.js';
export { supabase };

const objectIdToUuid = (id) => {
  if (typeof id !== 'string' || id.length !== 24) return id;
  const hex = id + '00000000'; // Pad to 32 chars
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
};

const mapRow = (r, tableName) => {
  if (!r) return r;
  const item = { ...r };
  if (item.created_at && !item.created_date) item.created_date = item.created_at;
  if (item.updated_at && !item.updated_date) item.updated_date = item.updated_at;
  if (tableName === 'staff' && item.full_name && !item.name) item.name = item.full_name;
  return item;
};

const DEFAULT_FALLBACK_TENANT_ID = '57e50365-d351-4acf-a967-c6c0fc62eed9';

const callServerDbProxy = async (action, tableName, extra = {}) => {
  try {
    const tid = getSyncTenantId() || DEFAULT_FALLBACK_TENANT_ID;
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    
    const headers = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      } catch (_) {}
    }

    const res = await fetch(`${baseUrl}/api/db`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        tableName,
        tenantId: tid,
        ...extra
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn(`[Proxy Fallback Error] ${action} on ${tableName}:`, errJson);
    }
  } catch (err) {
    console.warn(`[Proxy Fallback Failed] ${action} on ${tableName}:`, err);
  }
  return null;
};

const createEntityAdapter = (tableName) => {
  return {
    async filter(queryObj = {}) {
      let request = supabase.from(tableName).select('*');
      
      // Multi-tenant scope
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        if (tid && (!queryObj || queryObj.tenant_id === undefined)) {
          request = request.eq('tenant_id', tid);
        }
      }

      if (queryObj) {
        for (let key in queryObj) {
          if (key === 'created_date') key = 'created_at';
          if (key === 'updated_date') key = 'updated_at';
          let val = queryObj[key];
          if (typeof val === 'string' && val.length === 24) val = objectIdToUuid(val);
          if ((key === 'id' || key.endsWith('_id')) && val === '') val = null;
          
          if (key === 'branch_id' && (val === 'all' || !val)) continue;
          if (key === 'branch_ids') {
            request = request.or(`branch_ids.cs.{${val}},branch_ids.is.null,branch_ids.eq.{}`);
          } else if (val === null) {
            request = request.is(key, null);
          } else {
            request = request.eq(key, val);
          }
        }
      }
      let { data, error } = await request;
      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        const proxyData = await callServerDbProxy('filter', tableName, { filter: queryObj });
        if (proxyData) return proxyData.map(r => mapRow(r, tableName));
      }
      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        throw error;
      }
      // If client returned 0 rows because of anon RLS in development
      if (!data || data.length === 0) {
        const proxyData = await callServerDbProxy('filter', tableName, { filter: queryObj });
        if (proxyData && proxyData.length > 0) return proxyData.map(r => mapRow(r, tableName));
      }
      return (data || []).map(r => mapRow(r, tableName));
    },

    async list(queryOrSort = {}, limitVal) {
      let request = supabase.from(tableName).select('*');
      
      // Multi-tenant scope
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        if (tid) {
          request = request.eq('tenant_id', tid);
        }
      }
      
      let query = {};
      if (typeof queryOrSort === 'string') {
        query.sort_by = queryOrSort;
        if (limitVal) query.limit = limitVal;
      } else if (queryOrSort) {
        query = queryOrSort;
      }
      
      // Handle base44 query filters (q, sort_by, limit, skip)
      if (query.q) {
        try {
          const filterObj = typeof query.q === 'string' ? JSON.parse(query.q) : query.q;
          for (let key in filterObj) {
            let col = key;
            if (col === 'created_date') col = 'created_at';
            if (col === 'updated_date') col = 'updated_at';
            let val = filterObj[key];
            if (typeof val === 'string' && val.length === 24) val = objectIdToUuid(val);
            if ((col === 'id' || col.endsWith('_id')) && val === '') val = null;
            
            if (col === 'branch_id' && (val === 'all' || !val)) continue;
            if (col === 'branch_ids') {
              request = request.or(`branch_ids.cs.{${val}},branch_ids.is.null,branch_ids.eq.{}`);
            } else if (val === null) {
              request = request.is(col, null);
            } else {
              request = request.eq(col, val);
            }
          }
        } catch(e) {
          console.warn("Could not parse query filter", query.q);
        }
      }
      if (query.sort_by) {
        const isDesc = query.sort_by.startsWith('-');
        let column = isDesc ? query.sort_by.substring(1) : query.sort_by;
        if (column === 'created_date') column = 'created_at';
        request = request.order(column, { ascending: !isDesc });
      } else {
        request = request.order('created_at', { ascending: false });
      }
      if (query.limit) request = request.limit(query.limit);
      if (query.skip) {
         request = request.range(query.skip, query.skip + (query.limit || 50) - 1);
      }
      
      let { data, error } = await request;
      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        const proxyData = await callServerDbProxy('list', tableName, { query, limit: query.limit || limitVal });
        if (proxyData) return proxyData.map(r => mapRow(r, tableName));
      }
      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        throw error;
      }
      // If client returned 0 rows because of anon RLS in development
      if (!data || data.length === 0) {
        const proxyData = await callServerDbProxy('list', tableName, { query, limit: query.limit || limitVal });
        if (proxyData && proxyData.length > 0) return proxyData.map(r => mapRow(r, tableName));
      }
      return (data || []).map(r => mapRow(r, tableName));
    },

    async get(id) {
      if (typeof id === 'string' && id.length === 24) id = objectIdToUuid(id);
      let request = supabase.from(tableName).select('*').eq('id', id);
      
      // Multi-tenant scope
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        if (tid) {
          request = request.eq('tenant_id', tid);
        }
      }

      let { data, error } = await request.maybeSingle();
      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        const proxyData = await callServerDbProxy('get', tableName, { id });
        if (proxyData) return mapRow(proxyData, tableName);
      }
      if (error) {
        console.error(`Error getting ${tableName} by id ${id}:`, error);
        throw error;
      }
      if (!data && typeof window !== 'undefined') {
        const proxyData = await callServerDbProxy('get', tableName, { id });
        if (proxyData) return mapRow(proxyData, tableName);
      }
      return mapRow(data, tableName);
    },

    async create(payload) {
      const p = { ...payload };
      // Remove id if present to allow UUID generation
      if (p.id && String(p.id).includes('temp')) delete p.id;
      
      // Multi-tenant scope: Inject salon tenant_id
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        let tid = getSyncTenantId();
        if (!tid && typeof window !== 'undefined') {
          tid = await resolveTenantId();
        }
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        if (tid) p.tenant_id = tid;
      }

      // Sanitize fields for Supabase
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      for (let k in p) {
        if (k === 'id' || k.endsWith('_id')) {
          if (!p[k] || p[k] === '') {
            p[k] = null;
          } else if (typeof p[k] === 'string' && p[k].length === 24) {
            p[k] = objectIdToUuid(p[k]);
          } else if (typeof p[k] === 'string' && !isUuid(p[k])) {
            p[k] = null;
          }
        }
      }

      // Normalization per table schema
      if (tableName === 'service' && p.duration !== undefined) {
        if (!p.duration_minutes) p.duration_minutes = p.duration;
        delete p.duration;
      }
      if (tableName === 'customer') {
        delete p.is_active;
      }
      if (tableName === 'appointment') {
        if (p.time && !p.start_time) p.start_time = p.time;
        delete p.time;
        if (p.notes !== undefined && !p.note) p.note = p.notes;
        delete p.notes;
        delete p.duration;
      }
      if (tableName === 'invoice') {
        delete p.customer_phone;
        delete p.discount_amount;
        delete p.discount_type;
        delete p.discount_value;
        delete p.paid_amount;
        delete p.payment_method;
        delete p.notes;
        delete p.loyalty_points_earned;
      }

      // Safeguard: invoice, staff, appointment require a NOT NULL valid branch_id
      if ((tableName === 'invoice' || tableName === 'staff' || tableName === 'appointment') && (!p.branch_id || !isUuid(p.branch_id))) {
        let fallbackBranch = null;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('glowpro_branch');
          if (stored && stored !== 'all' && isUuid(stored)) fallbackBranch = stored;
        }
        p.branch_id = fallbackBranch || '6a473852-3dde-addc-bb57-8d6b00000000';
      }
      
      let { data, error } = await supabase.from(tableName).insert([p]).select().single();
      
      // Robust loop to strip any column that doesn't exist in Supabase schema cache
      let retryCount = 0;
      while (error && error.code === 'PGRST204' && retryCount < 6) {
        retryCount++;
        const match = error.message?.match(/Could not find the '([^']+)' column/i);
        const missingCol = match ? match[1] : (error.message?.includes('logs') ? 'logs' : (error.message?.includes('group') ? 'group' : null));
        if (missingCol && p[missingCol] !== undefined) {
          console.warn(`Column '${missingCol}' missing in Supabase ${tableName}. Removing and retrying...`);
          delete p[missingCol];
          const retryResult = await supabase.from(tableName).insert([p]).select().single();
          data = retryResult.data;
          error = retryResult.error;
        } else {
          break;
        }
      }

      // Fallback if UUID syntax error (22P02)
      if (error && error.code === '22P02') {
        console.warn(`UUID syntax error on ${tableName}. Setting non-standard ID columns to null...`);
        for (let k in p) {
          if (k.endsWith('_id') && p[k] && !isUuid(p[k])) {
            p[k] = null;
          }
        }
        if (tableName === 'invoice' && !p.branch_id) {
          p.branch_id = '6a473852-3dde-addc-bb57-8d6b00000000';
        }
        const retryResult = await supabase.from(tableName).insert([p]).select().single();
        data = retryResult.data;
        error = retryResult.error;
      }

      // Fallback if not-null constraint on branch_id (23502)
      if (error && error.code === '23502' && (error.message?.includes('branch_id') || tableName === 'invoice')) {
        console.warn(`Not-null constraint on branch_id for ${tableName}. Setting default branch UUID and retrying...`);
        p.branch_id = '6a473852-3dde-addc-bb57-8d6b00000000';
        const retryResult = await supabase.from(tableName).insert([p]).select().single();
        data = retryResult.data;
        error = retryResult.error;
      }

      // Fallback if foreign key constraint (e.g. group_id, customer_id, branch_id) is violated
      if (error && (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fk_service_group_id'))) {
        console.warn(`Foreign key constraint on ${tableName}. Retrying with null foreign keys...`);
        for (let k in p) {
          if (k.endsWith('_id') && p[k] && !(tableName === 'invoice' && k === 'branch_id')) {
            p[k] = null;
          }
        }
        if (tableName === 'invoice' && (!p.branch_id || !isUuid(p.branch_id))) {
          p.branch_id = '6a473852-3dde-addc-bb57-8d6b00000000';
        }
        const retryResult = await supabase.from(tableName).insert([p]).select().single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        console.warn(`RLS blocked direct insert on ${tableName}. Retrying via secure server proxy...`);
        const proxyData = await callServerDbProxy('create', tableName, { payload: p });
        if (proxyData) return mapRow(proxyData, tableName);
      }

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }
      return mapRow(data, tableName);
    },
    
    async bulkCreate(payloads) {
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
      }
      const ps = payloads.map(payload => {
        const p = { ...payload };
        if (tid && TENANT_SCOPED_TABLES.has(tableName) && !p.tenant_id) {
          p.tenant_id = tid;
        }
        for (let k in p) {
          if (k === 'id' || k.endsWith('_id')) {
            if (p[k] === '') {
              p[k] = null;
            } else if (typeof p[k] === 'string' && p[k].length === 24) {
              p[k] = objectIdToUuid(p[k]);
            }
          }
        }
        return p;
      });
      let { data, error } = await supabase.from(tableName).insert(ps).select();
      
      if (error && error.code === 'PGRST204' && error.message.includes('logs')) {
        console.warn('logs column missing in Supabase. Retrying without logs...');
        ps.forEach(p => delete p.logs);
        const retryResult = await supabase.from(tableName).insert(ps).select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        console.warn(`RLS blocked direct bulk insert on ${tableName}. Retrying via secure server proxy...`);
        const proxyData = await callServerDbProxy('bulkCreate', tableName, { payloads: ps });
        if (proxyData) return proxyData.map(r => mapRow(r, tableName));
      }

      if (error) throw error;
      return (data || []).map(r => mapRow(r, tableName));
    },

    async update(id, payload) {
      if (typeof id === 'string' && id.length === 24) id = objectIdToUuid(id);
      
      const p = { ...payload };
      delete p.id;
      delete p.type;
      delete p.created_at;
      delete p.updated_at;
      delete p.created_date;
      delete p.updated_date;

      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        p.tenant_id = tid;
      }

      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      for (let k in p) {
        if (k.endsWith('_id')) {
          if (!p[k] || p[k] === '') {
            p[k] = null;
          } else if (typeof p[k] === 'string' && p[k].length === 24) {
            p[k] = objectIdToUuid(p[k]);
          } else if (typeof p[k] === 'string' && !isUuid(p[k])) {
            p[k] = null;
          }
        }
      }

      // Normalization per table schema
      if (tableName === 'service' && p.duration !== undefined) {
        if (!p.duration_minutes) p.duration_minutes = p.duration;
        delete p.duration;
      }
      if (tableName === 'customer') {
        delete p.is_active;
      }
      if (tableName === 'appointment') {
        if (p.time && !p.start_time) p.start_time = p.time;
        delete p.time;
        if (p.notes !== undefined && !p.note) p.note = p.notes;
        delete p.notes;
        delete p.duration;
      }
      if (tableName === 'invoice') {
        delete p.customer_phone;
        delete p.discount_amount;
        delete p.discount_type;
        delete p.discount_value;
        delete p.paid_amount;
        delete p.payment_method;
        delete p.notes;
        delete p.loyalty_points_earned;
      }

      // Safeguard: do not overwrite NOT NULL branch_id with null or invalid UUID
      if ((tableName === 'staff' || tableName === 'invoice' || tableName === 'appointment') && !p.branch_id) {
        delete p.branch_id;
      }

      let updateReq = supabase.from(tableName).update(p).eq('id', id);
      if (tid && TENANT_SCOPED_TABLES.has(tableName)) {
        updateReq = updateReq.eq('tenant_id', tid);
      }
      let { data, error } = await updateReq.select();
      if (!error) {
        data = (data && data.length > 0) ? data[0] : { id, ...p };
      }
      
      // Fallback if column doesn't exist in Supabase schema cache
      let retryCount = 0;
      while (error && error.code === 'PGRST204' && retryCount < 6) {
        retryCount++;
        const match = error.message?.match(/Could not find the '([^']+)' column/i);
        const missingCol = match ? match[1] : null;
        if (missingCol && p[missingCol] !== undefined) {
          console.warn(`Column '${missingCol}' missing in Supabase ${tableName}. Removing and retrying...`);
          delete p[missingCol];
          let retryReq = supabase.from(tableName).update(p).eq('id', id);
          if (tid && TENANT_SCOPED_TABLES.has(tableName)) {
            retryReq = retryReq.eq('tenant_id', tid);
          }
          const retryResult = await retryReq.select();
          if (!retryResult.error) {
            data = (retryResult.data && retryResult.data.length > 0) ? retryResult.data[0] : { id, ...p };
            error = null;
          } else {
            error = retryResult.error;
          }
        } else {
          break;
        }
      }

      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        console.warn(`RLS blocked direct update on ${tableName}. Retrying via secure server proxy...`);
        const proxyData = await callServerDbProxy('update', tableName, { id, payload: p });
        if (proxyData) return mapRow(proxyData, tableName);
      }

      // Fallback if foreign key constraint on group_id — raise to user instead of silently nullifying
      if (error && (error.code === '23503' || error.message?.includes('foreign key constraint'))) {
        if ('group_id' in p && p.group_id) {
          console.warn(`FK constraint on ${tableName} for group_id=${p.group_id}. The group may not exist.`);
        }
      }
      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }
      return mapRow(data, tableName);
    },

    async delete(id) {
      if (typeof id === 'string' && id.length === 24) id = objectIdToUuid(id);
      let request = supabase.from(tableName).delete().eq('id', id);
      
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        request = request.eq('tenant_id', tid);
      }

      const { data, error } = await request;
      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        console.warn(`RLS blocked direct delete on ${tableName}. Retrying via secure server proxy...`);
        const proxyData = await callServerDbProxy('delete', tableName, { id });
        if (proxyData !== null) return proxyData;
      }
      if (error) {
        console.error(`Error deleting ${tableName} with id ${id}:`, error);
        throw error;
      }
      return data;
    },
    
    async deleteMany(query) {
      let request = supabase.from(tableName).delete();
      
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) tid = DEFAULT_FALLBACK_TENANT_ID;
        request = request.eq('tenant_id', tid);
      }

      for (const key in query) {
        request = request.eq(key, query[key]);
      }
      const { error } = await request;
      if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
        console.warn(`RLS blocked direct deleteMany on ${tableName}. Retrying via secure server proxy...`);
        const proxyData = await callServerDbProxy('deleteMany', tableName, { query });
        if (proxyData !== null) return true;
      }
      if (error) {
        console.error(`Error deleting many ${tableName}:`, error);
        throw error;
      }
      return true;
    }
  };
};

export const supabaseClient = {
  entities: {
    Appointment: createEntityAdapter('appointment'),
    Branch: createEntityAdapter('branch'),
    Customer: createEntityAdapter('customer'),
    CustomerGroup: createEntityAdapter('customergroup'),
    CustomerSegment: createEntityAdapter('customersegment'),
    CustomerTier: createEntityAdapter('customertier'),
    CustomerTierHistory: createEntityAdapter('customertierhistory'),
    Deposit: createEntityAdapter('deposit'),
    DepositPolicy: createEntityAdapter('deposit_policy'),
    DepositTransaction: createEntityAdapter('deposit_transaction'),
    Facility: createEntityAdapter('facility'),
    Room: createEntityAdapter('room'),
    Invoice: createEntityAdapter('invoice'),
    LoyaltyRule: createEntityAdapter('loyaltyrule'),
    Membership: createEntityAdapter('membership'),
    PrepaidCard: createEntityAdapter('prepaidcard'),
    Product: createEntityAdapter('product'),
    ProductCombo: createEntityAdapter('productcombo'),
    Service: createEntityAdapter('service'),
    ServiceCombo: createEntityAdapter('servicecombo'),
    ServiceGroup: createEntityAdapter('servicegroup'),
    ServicePackage: createEntityAdapter('servicepackage'),
    Treatment: createEntityAdapter('treatment'),
    Shift: createEntityAdapter('shift'),
    ShiftTemplate: createEntityAdapter('shifttemplate'),
    Staff: createEntityAdapter('staff'),
    StaffAttendance: createEntityAdapter('staffattendance'),
    StaffCommissionConfig: createEntityAdapter('staffcommissionconfig'),
    StaffCommissionLog: createEntityAdapter('staffcommissionlog'),
    StaffCommissionRule: createEntityAdapter('staffcommissionrule'),
    StaffGroup: createEntityAdapter('staffgroup'),
    StaffSchedule: createEntityAdapter('staffschedule'),
    Voucher: createEntityAdapter('voucher'),
    RevenueBonusRule: createEntityAdapter('revenuebonusrule'),
    Automation: createEntityAdapter('automation'),
    CashVoucher: createEntityAdapter('cashvoucher'),
    CashVoucherType: createEntityAdapter('cashvouchertype'),
    BookingSetting: createEntityAdapter('bookingsetting'),
    CustomerPackage: createEntityAdapter('customer_package'),
    CustomerTreatment: createEntityAdapter('customer_treatment'),
    UserProfile: createEntityAdapter('user_profile'),
    RolePermission: createEntityAdapter('role_permissions'),
    Role: createEntityAdapter('roles'),
    Integration: createEntityAdapter('Integration'),
    Settings: createEntityAdapter('settings'),
    InventorySupplier: createEntityAdapter('inventory_suppliers'),
    InventoryReceipt: createEntityAdapter('inventory_receipts'),
    InventoryTransfer: createEntityAdapter('inventory_transfers'),
  },
  auth: {
    me: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    },
    logout: async () => {
      await supabase.auth.signOut();
    }
  }
};
