import { formatVND } from '@/lib/format';

/**
 * Calculates total commission for an invoice item.
 * Adds customer request commission surcharge if the item was requested by the customer.
 * 
 * @param {Object} item Invoice detail item { id, name, type, price, qty, staff_id, is_customer_requested }
 * @param {Array} commissionRules All StaffCommissionRules loaded from the DB
 * @returns {Object} { earned, ruleLabel }
 */
export function calculateItemCommission(item, commissionRules) {
  const staffId = item.staff_id;
  if (!staffId) return { earned: 0, ruleLabel: '—' };

  const itemPrice = item.price || 0;
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
    const reqRule = commissionRules.find(r => r.staff_id === staffId && r.item_type === 'customer_req' && r.item_id === 'customer_req');
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

  return { earned, ruleLabel };
}
