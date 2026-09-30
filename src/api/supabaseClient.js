import { supabase } from '../lib/supabaseClient';
import { TENANT_SCOPED_TABLES, getSyncTenantId, resolveTenantId } from '../lib/tenantManager';
export { supabase };

const objectIdToUuid = (id) => {
  if (typeof id !== 'string' || id.length !== 24) return id;
  const hex = id + '00000000'; // Pad to 32 chars
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
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
        if (!tid && tableName !== 'bookingsetting') {
          throw new Error(`[Security Exception] Query blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
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
          
          if (key === 'branch_ids') {
            request = request.or(`branch_ids.cs.{${val}},branch_ids.is.null,branch_ids.eq.{}`);
          } else if (val === null) {
            request = request.is(key, null);
          } else {
            request = request.eq(key, val);
          }
        }
      }
      const { data, error } = await request;
      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        throw error;
      }
      return data.map(r => {
        if (r.created_at) r.created_date = r.created_at;
        if (r.updated_at) r.updated_date = r.updated_at;
        if (tableName === 'staff' && r.full_name) r.name = r.full_name;
        return r;
      });
    },

    async list(queryOrSort = {}, limitVal) {
      let request = supabase.from(tableName).select('*');
      
      // Multi-tenant scope
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid && tableName !== 'bookingsetting') {
          throw new Error(`[Security Exception] Query blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
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
      
      const { data, error } = await request;
      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        throw error;
      }
      return data.map(r => {
        if (r.created_at) r.created_date = r.created_at;
        if (r.updated_at) r.updated_date = r.updated_at;
        if (tableName === 'staff' && r.full_name) r.name = r.full_name;
        return r;
      });
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
        if (!tid && tableName !== 'bookingsetting') {
          throw new Error(`[Security Exception] Query blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
        if (tid) {
          request = request.eq('tenant_id', tid);
        }
      }

      const { data, error } = await request.single();
      if (error) {
        console.error(`Error getting ${tableName} by id ${id}:`, error);
        throw error;
      }
      if (data) {
        if (data.created_at) data.created_date = data.created_at;
        if (data.updated_at) data.updated_date = data.updated_at;
        if (tableName === 'staff' && data.full_name) data.name = data.full_name;
      }
      return data;
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
        if (!tid && tableName !== 'appointment') {
          throw new Error(`[Security Exception] Create blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
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

      // Safeguard: invoice requires a NOT NULL valid branch_id
      if (tableName === 'invoice' && (!p.branch_id || !isUuid(p.branch_id))) {
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

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }
      if (data) {
        if (data.created_at) data.created_date = data.created_at;
        if (data.updated_at) data.updated_date = data.updated_at;
        if (tableName === 'staff' && data.full_name) data.name = data.full_name;
      }
      return data;
    },
    
    async bulkCreate(payloads) {
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) {
          throw new Error(`[Security Exception] BulkCreate blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
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

      if (error) throw error;
      return data.map(r => {
        if (r.created_at) r.created_date = r.created_at;
        if (r.updated_at) r.updated_date = r.updated_at;
        if (tableName === 'staff' && r.full_name) r.name = r.full_name;
        return r;
      });
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
        if (!tid) {
          throw new Error(`[Security Exception] Update blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
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

      let updateReq = supabase.from(tableName).update(p).eq('id', id);
      if (tid && TENANT_SCOPED_TABLES.has(tableName)) {
        updateReq = updateReq.eq('tenant_id', tid);
      }
      let { data, error } = await updateReq.select().single();
      
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
          const retryResult = await retryReq.select().single();
          data = retryResult.data;
          error = retryResult.error;
        } else {
          break;
        }
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
      if (data) {
        if (data.created_at) data.created_date = data.created_at;
        if (data.updated_at) data.updated_date = data.updated_at;
        if (tableName === 'staff' && data.full_name) data.name = data.full_name;
      }
      return data;
    },

    async delete(id) {
      if (typeof id === 'string' && id.length === 24) id = objectIdToUuid(id);
      let request = supabase.from(tableName).delete().eq('id', id);
      
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }
      if (TENANT_SCOPED_TABLES.has(tableName)) {
        if (!tid) {
          throw new Error(`[Security Exception] Delete blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
        request = request.eq('tenant_id', tid);
      }

      const { data, error } = await request;
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
        if (!tid) {
          throw new Error(`[Security Exception] DeleteMany blocked: Table '${tableName}' requires an active tenant context, but tenant_id is missing.`);
        }
        request = request.eq('tenant_id', tid);
      }

      for (const key in query) {
        request = request.eq(key, query[key]);
      }
      const { error } = await request;
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
