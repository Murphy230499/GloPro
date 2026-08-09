import { supabase } from '../lib/supabaseClient';
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
      if (queryObj) {
        for (let key in queryObj) {
          if (key === 'created_date') key = 'created_at';
          if (key === 'updated_date') key = 'updated_at';
          let val = queryObj[key];
          if (typeof val === 'string' && val.length === 24) val = objectIdToUuid(val);
          
          if (key === 'branch_ids') {
            request = request.or(`branch_ids.cs.{${val}},branch_ids.is.null,branch_ids.eq.{}`);
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
            
            if (col === 'branch_ids') {
              request = request.or(`branch_ids.cs.{${val}},branch_ids.is.null,branch_ids.eq.{}`);
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
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
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
      
      // Sanitize fields for Supabase
      for (let k in p) {
        if (k === 'id' || k.endsWith('_id')) {
          if (p[k] === '') {
            p[k] = null;
          } else if (typeof p[k] === 'string' && p[k].length === 24) {
            p[k] = objectIdToUuid(p[k]);
          }
        }
      }
      
      let { data, error } = await supabase.from(tableName).insert([p]).select().single();
      
      // Fallback if column doesn't exist in Supabase schema cache
      if (error && error.code === 'PGRST204') {
        const match = error.message?.match(/Could not find the '([^']+)' column/i);
        const missingCol = match ? match[1] : (error.message?.includes('logs') ? 'logs' : (error.message?.includes('group') ? 'group' : null));
        if (missingCol && p[missingCol] !== undefined) {
          console.warn(`Column '${missingCol}' missing in Supabase ${tableName}. Retrying without '${missingCol}'...`);
          delete p[missingCol];
          const retryResult = await supabase.from(tableName).insert([p]).select().single();
          data = retryResult.data;
          error = retryResult.error;
        }
      }

      // Fallback if foreign key constraint (e.g. group_id) is violated
      if (error && (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fk_service_group_id'))) {
        if ('group_id' in p) {
          console.warn(`Foreign key constraint on ${tableName}. Retrying with group_id = null...`);
          p.group_id = null;
          const retryResult = await supabase.from(tableName).insert([p]).select().single();
          data = retryResult.data;
          error = retryResult.error;
        }
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
      const ps = payloads.map(payload => {
        const p = { ...payload };
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

      for (let k in p) {
        if (k.endsWith('_id')) {
          if (p[k] === '') {
            p[k] = null;
          } else if (typeof p[k] === 'string' && p[k].length === 24) {
            p[k] = objectIdToUuid(p[k]);
          }
        }
      }

      let { data, error } = await supabase.from(tableName).update(p).eq('id', id).select().single();
      
      // Fallback if column doesn't exist in Supabase schema cache
      if (error && error.code === 'PGRST204') {
        const match = error.message?.match(/Could not find the '([^']+)' column/i);
        const missingCol = match ? match[1] : (error.message?.includes('logs') ? 'logs' : (error.message?.includes('group') ? 'group' : null));
        if (missingCol && p[missingCol] !== undefined) {
          console.warn(`Column '${missingCol}' missing in Supabase ${tableName}. Retrying without '${missingCol}'...`);
          delete p[missingCol];
          const retryResult = await supabase.from(tableName).update(p).eq('id', id).select().single();
          data = retryResult.data;
          error = retryResult.error;
        }
      }

      // Fallback if foreign key constraint (e.g. group_id) is violated
      if (error && (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fk_service_group_id'))) {
        if ('group_id' in p) {
          console.warn(`Foreign key constraint on ${tableName}. Retrying with group_id = null...`);
          p.group_id = null;
          const retryResult = await supabase.from(tableName).update(p).eq('id', id).select().single();
          data = retryResult.data;
          error = retryResult.error;
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
      const { data, error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        console.error(`Error deleting ${tableName} with id ${id}:`, error);
        throw error;
      }
      return data;
    },
    
    async deleteMany(query) {
      let request = supabase.from(tableName).delete();
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
