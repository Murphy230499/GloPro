import { base44 } from '@/api/base44Client';

// Safe JSON parser helper
const safeParse = (str, fallback = []) => {
  if (!str || str === 'undefined') return fallback;
  try {
    const val = JSON.parse(str);
    return val === null ? fallback : val;
  } catch (e) {
    return fallback;
  }
};

const localId = () => 'local_' + Date.now() + Math.random().toString(36).substr(2, 5);

// ==================== CUSTOMER TIERS ====================
export const loadCustomerTiers = async () => {
  try {
    const list = await base44.entities.CustomerTier.list();
    if (list && list.length > 0) return list;
    throw new Error('Empty');
  } catch (e) {
    const local = localStorage.getItem('glopro_customer_tiers');
    const parsed = safeParse(local, []);
    if (parsed.length > 0) return parsed;
    
    // Return default tiers if nothing exists anywhere
    const defaults = [
      { id: 'tier_silver', name: 'Hạng Bạc', min_spend: 1000000, min_points: 100, discount_percent: 2, discount_amount: 0, maintenance_period: 'year', maintenance_days: 365, color: '#94A3B8' },
      { id: 'tier_gold', name: 'Hạng Vàng', min_spend: 5000000, min_points: 500, discount_percent: 5, discount_amount: 0, maintenance_period: 'year', maintenance_days: 365, color: '#FBBF24' },
      { id: 'tier_diamond', name: 'Hạng Kim Cương', min_spend: 15000000, min_points: 1500, discount_percent: 10, discount_amount: 0, maintenance_period: 'year', maintenance_days: 365, color: '#60A5FA' }
    ];
    localStorage.setItem('glopro_customer_tiers', JSON.stringify(defaults));
    return defaults;
  }
};

export const saveCustomerTier = async (data) => {
  const payload = {
    name: data.name,
    min_spend: Number(data.min_spend) || 0,
    min_points: Number(data.min_points) || 0,
    discount_percent: Number(data.discount_percent) || 0,
    discount_amount: Number(data.discount_amount) || 0,
    maintenance_period: data.maintenance_period || 'year',
    maintenance_days: Number(data.maintenance_days) || 365,
    color: data.color || '#FF6B9D'
  };

  try {
    if (data.id && !data.id.toString().startsWith('local_') && !data.id.toString().startsWith('tier_')) {
      return await base44.entities.CustomerTier.update(data.id, payload);
    } else if (!data.id) {
      return await base44.entities.CustomerTier.create(payload);
    } else {
      throw new Error('Local item update');
    }
  } catch (e) {
    const list = await loadCustomerTiers();
    let updated;
    if (data.id) {
      updated = list.map(x => x.id === data.id ? { ...x, ...payload } : x);
    } else {
      const newItem = { id: localId(), ...payload };
      updated = [...list, newItem];
    }
    localStorage.setItem('glopro_customer_tiers', JSON.stringify(updated));
    return data.id ? { id: data.id, ...payload } : updated[updated.length - 1];
  }
};

export const deleteCustomerTier = async (id) => {
  try {
    if (id.toString().startsWith('local_') || id.toString().startsWith('tier_')) {
      throw new Error('Local delete');
    }
    await base44.entities.CustomerTier.delete(id);
  } catch (e) {
    const list = await loadCustomerTiers();
    const filtered = list.filter(x => x.id !== id);
    localStorage.setItem('glopro_customer_tiers', JSON.stringify(filtered));
  }
};

// ==================== TIER HISTORY ====================
export const loadCustomerTierHistory = async () => {
  try {
    const list = await base44.entities.CustomerTierHistory.list();
    if (list && Array.isArray(list)) return list;
    throw new Error('Empty');
  } catch (e) {
    const local = localStorage.getItem('glopro_customer_tier_history');
    const parsed = safeParse(local, []);
    return Array.isArray(parsed) ? parsed : [];
  }
};

export const saveCustomerTierHistory = async (data) => {
  const payload = {
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    old_tier_name: data.old_tier_name || 'Hạng thường',
    new_tier_name: data.new_tier_name,
    reason: data.reason || 'Cập nhật hệ thống',
    date: data.date || new Date().toISOString().split('T')[0]
  };

  try {
    await base44.entities.CustomerTierHistory.create(payload);
  } catch (e) {
    const list = await loadCustomerTierHistory();
    const newItem = { id: localId(), ...payload };
    localStorage.setItem('glopro_customer_tier_history', JSON.stringify([newItem, ...list]));
  }
};

// ==================== CUSTOMER SEGMENTS ====================
export const loadCustomerSegments = async () => {
  try {
    const list = await base44.entities.CustomerSegment.list();
    if (list && list.length > 0) {
      return list.map(x => ({ 
        ...x, 
        conditions: typeof x.conditions === 'string' ? safeParse(x.conditions, {}) : (x.conditions || {}) 
      }));
    }
    throw new Error('Empty');
  } catch (e) {
    const local = localStorage.getItem('glopro_customer_segments');
    const parsed = safeParse(local, []);
    if (parsed.length > 0) return parsed;
    
    // Default Segments
    const defaults = [
      { id: 'seg_inactive', name: 'Khách hàng ngủ đông (Chưa ghé > 30 ngày)', color: '#EF4444', conditions: { last_visit_days_gt: 30 } },
      { id: 'seg_vip', name: 'Khách hàng chi tiêu cao (VIP > 5tr)', color: '#FBBF24', conditions: { total_spent_gt: 5000000 } },
      { id: 'seg_new', name: 'Khách hàng mới (Ghé 1 lần)', color: '#3B82F6', conditions: { visit_count_eq: 1 } }
    ];
    localStorage.setItem('glopro_customer_segments', JSON.stringify(defaults));
    return defaults;
  }
};

export const saveCustomerSegment = async (data) => {
  const payload = {
    name: data.name,
    color: data.color || '#34D399',
    conditions: JSON.stringify(data.conditions || {})
  };

  try {
    if (data.id && !data.id.toString().startsWith('local_') && !data.id.toString().startsWith('seg_')) {
      const res = await base44.entities.CustomerSegment.update(data.id, payload);
      return { ...res, conditions: data.conditions };
    } else if (!data.id) {
      const res = await base44.entities.CustomerSegment.create(payload);
      return { ...res, conditions: data.conditions };
    } else {
      throw new Error('Local item update');
    }
  } catch (e) {
    const list = await loadCustomerSegments();
    let updated;
    const localPayload = { ...payload, conditions: data.conditions };
    if (data.id) {
      updated = list.map(x => x.id === data.id ? { ...x, ...localPayload } : x);
    } else {
      const newItem = { id: localId(), ...localPayload };
      updated = [...list, newItem];
    }
    localStorage.setItem('glopro_customer_segments', JSON.stringify(updated));
    return data.id ? { id: data.id, ...localPayload } : updated[updated.length - 1];
  }
};

export const deleteCustomerSegment = async (id) => {
  try {
    if (id.toString().startsWith('local_') || id.toString().startsWith('seg_')) {
      throw new Error('Local delete');
    }
    await base44.entities.CustomerSegment.delete(id);
  } catch (e) {
    const list = await loadCustomerSegments();
    const filtered = list.filter(x => x.id !== id);
    localStorage.setItem('glopro_customer_segments', JSON.stringify(filtered));
  }
};

// ==================== LOYALTY RULES ====================
export const loadLoyaltyRule = async () => {
  try {
    const list = await base44.entities.LoyaltyRule.list();
    if (list && list.length > 0) {
      const rule = list[0];
      return {
        ...rule,
        excluded_item_ids: typeof rule.excluded_item_ids === 'string' ? safeParse(rule.excluded_item_ids, []) : (rule.excluded_item_ids || [])
      };
    }
    throw new Error('Empty');
  } catch (e) {
    const local = localStorage.getItem('glopro_loyalty_rule');
    const parsed = safeParse(local, null);
    if (parsed) return parsed;
    
    // Defaults
    const defaults = {
      id: 'default_loyalty_rule',
      earn_on_service: true,
      earn_on_product: true,
      earn_on_package: true,
      earn_on_treatment: true,
      earn_on_prepaid_card: false,
      earn_on_booking: true,
      earn_on_referral: true,
      points_per_vnd: 10000,
      booking_points: 50,
      referral_points: 100,
      reset_schedule: 'none',
      reset_inactivity_days: 365,
      excluded_item_ids: []
    };
    localStorage.setItem('glopro_loyalty_rule', JSON.stringify(defaults));
    return defaults;
  }
};

export const saveLoyaltyRule = async (data) => {
  const payload = {
    earn_on_service: !!data.earn_on_service,
    earn_on_product: !!data.earn_on_product,
    earn_on_package: !!data.earn_on_package,
    earn_on_treatment: !!data.earn_on_treatment,
    earn_on_prepaid_card: !!data.earn_on_prepaid_card,
    earn_on_booking: !!data.earn_on_booking,
    earn_on_referral: !!data.earn_on_referral,
    points_per_vnd: Number(data.points_per_vnd) || 10000,
    booking_points: Number(data.booking_points) || 50,
    referral_points: Number(data.referral_points) || 100,
    reset_schedule: data.reset_schedule || 'none',
    reset_inactivity_days: Number(data.reset_inactivity_days) || 365,
    excluded_item_ids: JSON.stringify(data.excluded_item_ids || [])
  };

  try {
    if (data.id && data.id !== 'default_loyalty_rule') {
      const res = await base44.entities.LoyaltyRule.update(data.id, payload);
      return { ...res, excluded_item_ids: data.excluded_item_ids || [] };
    } else {
      const list = await base44.entities.LoyaltyRule.list();
      if (list && list.length > 0) {
        const res = await base44.entities.LoyaltyRule.update(list[0].id, payload);
        return { ...res, excluded_item_ids: data.excluded_item_ids || [] };
      } else {
        const res = await base44.entities.LoyaltyRule.create(payload);
        return { ...res, excluded_item_ids: data.excluded_item_ids || [] };
      }
    }
  } catch (e) {
    const localPayload = { id: 'default_loyalty_rule', ...payload, excluded_item_ids: data.excluded_item_ids || [] };
    localStorage.setItem('glopro_loyalty_rule', JSON.stringify(localPayload));
    return localPayload;
  }
};
