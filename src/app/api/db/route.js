import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ALLOWED_TABLES = new Set([
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
  'integration',
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
  'settings',
  'shift',
  'shifttemplate',
  'staff',
  'staff_leaves',
  'staffattendance',
  'staffcommissionconfig',
  'staffcommissionlog',
  'staffcommissionrule',
  'staffgroup',
  'staffschedule',
  'treatment',
  'user',
  'user_profile',
  'voucher',
  'vouchers'
]);

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const objectIdToUuid = (id) => {
  if (typeof id !== 'string' || id.length !== 24) return id;
  const hex = id + '00000000';
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
};

const sanitizePayload = (tableName, payload, tid) => {
  const p = { ...payload };
  if (!p.tenant_id && tid) p.tenant_id = tid;

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

  // Schema-specific sanitization
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

  // Required branch_id safeguard
  if ((tableName === 'invoice' || tableName === 'staff' || tableName === 'appointment') && (!p.branch_id || !isUuid(p.branch_id))) {
    p.branch_id = '6a473852-3dde-addc-bb57-8d6b00000000';
  }

  return p;
};

const KNOWN_TENANTS = {
  'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'dev@glopro.local': '57e50365-d351-4acf-a967-c6c0fc62eed9'
};

async function authenticateAndAuthorize(request, requestedTenantId) {
  const authHeader = request.headers.get('authorization');
  let authenticatedUser = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) {
        authenticatedUser = user;
      }
    } catch (_) {}
  }

  // 1. If user is authenticated via Supabase JWT
  if (authenticatedUser) {
    const userEmail = (authenticatedUser.email || '').toLowerCase();
    
    // Look up profile to get true tenant_id
    const { data: profile } = await supabaseAdmin
      .from('user_profile')
      .select('id, tenant_id, role')
      .eq('id', authenticatedUser.id)
      .maybeSingle();

    const authorizedTenantId = 
      profile?.tenant_id || 
      authenticatedUser.user_metadata?.tenant_id || 
      KNOWN_TENANTS[userEmail] || 
      KNOWN_TENANTS[authenticatedUser.id];

    if (!authorizedTenantId) {
      return { error: 'Tài khoản chưa được liên kết với Salon nào', status: 403 };
    }

    // IDOR Check: Caller cannot access another salon's data
    if (requestedTenantId && requestedTenantId !== authorizedTenantId) {
      console.warn(`[IDOR BLOCKED] User ${userEmail} attempted to access tenant ${requestedTenantId} instead of ${authorizedTenantId}`);
      return { error: 'Truy cập bị từ chối: Bạn không có quyền truy cập dữ liệu của Salon này', status: 403 };
    }

    return { tenantId: authorizedTenantId, user: authenticatedUser };
  }

  // 2. Allow fallback ONLY in local development
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const devFallbackTenant = requestedTenantId || '57e50365-d351-4acf-a967-c6c0fc62eed9';
    return { tenantId: devFallbackTenant, user: null };
  }

  // 3. In production, unauthenticated requests are strictly forbidden
  return { error: 'Yêu cầu đăng nhập để truy cập dữ liệu (Unauthorized)', status: 401 };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, tableName, payload, id, filter, payloads, tenantId, query, limit } = body;

    const tbl = String(tableName || '').toLowerCase();
    if (!ALLOWED_TABLES.has(tbl)) {
      return NextResponse.json({ error: `Table '${tableName}' is not allowed` }, { status: 400 });
    }

    const authCheck = await authenticateAndAuthorize(request, tenantId);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const tid = authCheck.tenantId;

    if (action === 'get') {
      const { data, error } = await supabaseAdmin.from(tbl).select('*').eq('id', id).eq('tenant_id', tid).maybeSingle();
      if (error) {
        console.error(`[API /db] get error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'create') {
      const p = sanitizePayload(tbl, payload, tid);
      if (p.id && String(p.id).includes('temp')) delete p.id;
      
      const { data, error } = await supabaseAdmin.from(tbl).insert([p]).select().single();
      if (error) {
        console.error(`[API /db] create error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'bulkCreate') {
      const ps = (payloads || []).map(p => sanitizePayload(tbl, p, tid));
      const { data, error } = await supabaseAdmin.from(tbl).insert(ps).select();
      if (error) {
        console.error(`[API /db] bulkCreate error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update') {
      const p = sanitizePayload(tbl, payload, tid);
      delete p.id;
      delete p.created_at;
      delete p.updated_at;
      delete p.created_date;
      delete p.updated_date;
      p.tenant_id = tid;
      
      const { data, error } = await supabaseAdmin.from(tbl).update(p).eq('id', id).select();
      if (error) {
        console.error(`[API /db] update error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: data?.[0] || { id, ...p } });
    }

    if (action === 'delete') {
      const { data, error } = await supabaseAdmin.from(tbl).delete().eq('id', id).eq('tenant_id', tid);
      if (error) {
        console.error(`[API /db] delete error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'deleteMany') {
      let req = supabaseAdmin.from(tbl).delete().eq('tenant_id', tid);
      if (query) {
        for (const k in query) {
          req = req.eq(k, query[k]);
        }
      }
      const { data, error } = await req;
      if (error) {
        console.error(`[API /db] deleteMany error on ${tbl}:`, error);
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'list') {
      let req = supabaseAdmin.from(tbl).select('*').eq('tenant_id', tid);
      if (query?.q) {
        try {
          const filterObj = typeof query.q === 'string' ? JSON.parse(query.q) : query.q;
          for (let key in filterObj) {
            let col = key;
            if (col === 'created_date') col = 'created_at';
            if (col === 'updated_date') col = 'updated_at';
            let val = filterObj[key];
            if (col === 'branch_id' && (val === 'all' || !val)) continue;
            if (val === null) {
              req = req.is(col, null);
            } else {
              req = req.eq(col, val);
            }
          }
        } catch(e) {}
      }
      if (query?.sort_by) {
        const isDesc = query.sort_by.startsWith('-');
        const col = isDesc ? query.sort_by.substring(1) : query.sort_by;
        req = req.order(col === 'created_date' ? 'created_at' : col, { ascending: !isDesc });
      } else {
        req = req.order('created_at', { ascending: false });
      }
      if (limit) req = req.limit(limit);
      const { data, error } = await req;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'filter') {
      let req = supabaseAdmin.from(tbl).select('*').eq('tenant_id', tid);
      if (filter) {
        for (const k in filter) {
          if (k === 'branch_id' && (filter[k] === 'all' || !filter[k])) continue;
          if (filter[k] === null) {
            req = req.is(k, null);
          } else {
            req = req.eq(k, filter[k]);
          }
        }
      }
      const { data, error } = await req;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[API /db] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
