import { formatVND } from '@/lib/format';

/**
 * Calculates total commission for an invoice item.
 * Adds customer request commission surcharge and overtime (time-based) commission surcharge.
 * 
 * @param {Object} item Invoice detail item { id, name, type, price, qty, staff_id, is_customer_requested }
 * @param {Array} commissionRules All StaffCommissionRules loaded from the DB
 * @param {String} createdTime ISO timestamp or time string of when the invoice was created
 * @returns {Object} { earned, ruleLabel }
 */
export function calculateItemCommission(item, commissionRules, createdTime, advancedConfigs, invoice) {
  const staffId = item.staff_id;
  if (!staffId) return { earned: 0, ruleLabel: '—' };

  // Determine discount factor if calculation is set to after_discount
  const config = (advancedConfigs || []).find(c => c.item_type === item.type);
  const isAfterDiscount = config ? config.calc_method === 'after_discount' : false;
  let discountFactor = 1;
  if (isAfterDiscount && invoice && invoice.subtotal > 0) {
    discountFactor = 1 - (invoice.discount || 0) / invoice.subtotal;
  }

  const itemPrice = (item.price || 0) * discountFactor;
  const qty = item.qty || 1;
  const revenue = itemPrice * qty;

  // 1. Match item specific or general type commission rule
  // Try staff specific rule first, then system default ('all')
  let rule = commissionRules.find(r => r.staff_id === staffId && (r.item_id === item.id || r.item_id === item.name));
  
  if (!rule) {
    rule = commissionRules.find(r => r.staff_id === 'all' && (r.item_id === item.id || r.item_id === item.name));
  }

  if (!rule) {
    rule = commissionRules.find(r => r.staff_id === staffId && r.item_type === item.type && r.item_id === 'all');
  }

  if (!rule) {
    rule = commissionRules.find(r => r.staff_id === 'all' && r.item_type === item.type && r.item_id === 'all');
  }

  let earned = 0;
  let ruleLabel = '30%';

  if (rule) {
    if (rule.commission_type === 'percent') {
      earned = Math.round(revenue * (rule.commission_value / 100));
      ruleLabel = `${rule.commission_value}%`;
    } else {
      earned = rule.commission_value * qty;
      ruleLabel = `${formatVND(rule.commission_value)}`;
    }
  } else {
    // Default fallback 30%
    earned = Math.round(revenue * 0.3);
  }

  // 2. Add customer request commission if flagged
  if (item.is_customer_requested) {
    // Try service-specific customer request rule first, then fallback to general customer request rule
    let reqRule = commissionRules.find(r => r.staff_id === staffId && r.item_type === 'customer_req_service' && (r.item_id === item.id || r.item_id === item.name));
    if (!reqRule) {
      reqRule = commissionRules.find(r => r.staff_id === staffId && r.item_type === 'customer_req' && r.item_id === 'customer_req');
    }
    
    if (reqRule) {
      let extraEarned = 0;
      let reqLabel = '';
      if (reqRule.commission_type === 'percent') {
        extraEarned = Math.round(revenue * (reqRule.commission_value / 100));
        reqLabel = `+${reqRule.commission_value}%`;
      } else {
        extraEarned = reqRule.commission_value * qty;
        reqLabel = `+${formatVND(reqRule.commission_value)}`;
      }
      earned += extraEarned;
      ruleLabel = `${ruleLabel} ${reqLabel} (Yêu cầu)`;
    }
  }

  // 3. Add overtime time-based commission if invoice falls in configured slots
  if (createdTime && item.type === 'service') {
    let invoiceTime = null;
    try {
      if (createdTime.includes('T') && createdTime.includes(':')) {
        const d = new Date(createdTime);
        const pad = (n) => String(n).padStart(2, '0');
        invoiceTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else if (createdTime.includes(':')) {
        invoiceTime = createdTime.slice(0, 5);
      }
    } catch (e) {
      console.error('Error parsing invoice time:', e);
    }

    if (invoiceTime) {
      const otRules = commissionRules.filter(r => r.staff_id === staffId && r.item_type === 'overtime_service' && (r.item_id === item.id || r.item_id === item.name));
      otRules.forEach(r => {
        const parts = r.commission_type.split('_');
        const type = parts[0] || 'percent';
        const from = parts[1] || '18:00';
        const to = parts[2] || '19:00';

        if (invoiceTime >= from && invoiceTime <= to) {
          let extraEarned = 0;
          let otLabel = '';
          if (type === 'percent') {
            extraEarned = Math.round(revenue * (r.commission_value / 100));
            otLabel = `+${r.commission_value}%`;
          } else {
            extraEarned = r.commission_value * qty;
            otLabel = `+${formatVND(r.commission_value)}`;
          }
          earned += extraEarned;
          ruleLabel = `${ruleLabel} ${otLabel} (Tăng ca ${from}-${to})`;
        }
      });
    }
  }

  return { earned, ruleLabel };
}

/**
 * Calculates all revenue-based bonus rewards for a staff member.
 * Supports threshold milestone matching and progressive tiered mechanisms.
 * 
 * @param {String} staffId Employee UUID
 * @param {Array} invoices All invoices loaded from the DB
 * @param {Array} bonusRules All RevenueBonusRules loaded from the DB
 * @returns {Object} { totalBonus, details: [{ name, earned, mechanism, totalRev }] }
 */
export function calculateRevenueBonus(staffId, invoices, bonusRules, advancedConfigs) {
  let totalBonus = 0;
  const details = [];

  if (!staffId || !bonusRules || bonusRules.length === 0) {
    return { totalBonus, details };
  }

  bonusRules.forEach(rule => {
    // 1. Check if employee is eligible
    const staffIds = rule.staff_ids || [];
    if (!staffIds.includes(staffId)) return;

    // 2. Compute total applicable revenue from paid invoices
    let totalRev = 0;
    const itemIds = rule.item_ids || [];

    invoices.forEach(inv => {
      if (inv.status !== 'paid') return;
      
      const discountFactor = inv.subtotal > 0 ? (1 - (inv.discount || 0) / inv.subtotal) : 1;

      (inv.items || []).forEach(it => {
        if (it.staff_id === staffId) {
          const isItemMatched = itemIds.length === 0 || itemIds.includes(it.id) || itemIds.includes(it.name);
          if (isItemMatched) {
            // Apply advanced config discount check
            const config = (advancedConfigs || []).find(c => c.item_type === it.type);
            const isAfterDiscount = config ? config.calc_method === 'after_discount' : false;
            
            const price = (it.price || 0) * (isAfterDiscount ? discountFactor : 1);
            totalRev += price * (it.qty || 1);
          }
        }
      });
    });

    // 3. Compute earned bonus based on selected mechanism
    let earned = 0;
    const sortedRanges = [...(rule.ranges || [])].sort((a, b) => a.from - b.from);

    if (rule.mechanism === 'threshold') {
      // Threshold: find the highest milestone met
      const matchedRange = [...sortedRanges].reverse().find(rg => totalRev >= rg.from);
      if (matchedRange) {
        if (matchedRange.type === 'percent') {
          earned = Math.round(totalRev * (matchedRange.value / 100));
        } else {
          earned = matchedRange.value;
        }
      }
    } else {
      // Tiered (Lũy tiến bậc thang)
      sortedRanges.forEach(rg => {
        const amtInRange = Math.max(0, Math.min(totalRev, rg.to) - rg.from);
        if (amtInRange > 0) {
          if (rg.type === 'percent') {
            earned += Math.round(amtInRange * (rg.value / 100));
          } else {
            earned += rg.value;
          }
        }
      });
    }

    if (earned > 0) {
      totalBonus += earned;
      details.push({
        name: rule.name,
        earned,
        mechanism: rule.mechanism === 'threshold' ? 'Mốc doanh thu' : 'Lũy tiến bậc thang',
        totalRev
      });
    }
  });

  return { totalBonus, details };
}
